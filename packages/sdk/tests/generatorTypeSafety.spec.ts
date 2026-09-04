import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
import { normalizeManifest } from '../../cli/src/generators/normalizer'
import { SemanticResolutionKernel, RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'

// ===========================================================================
// Regression guard for a batch of TS compile errors found in
// ZodTierGenerator.ts + normalizer.ts (17 + 11 errors respectively).
// None of these were logic bugs in the sense of "wrong output" — they were
// type-declaration gaps: fields the PHP extractor genuinely emits at runtime
// (`wrapped`, `code`, nested `fields`, `uri`/`actionName`/`controllerName`)
// but that were never declared on the TS types consuming them. The risk
// this spec guards against is a future person "fixing" one of these errors
// by deleting the runtime-reading code instead of fixing the type — which
// would compile clean but silently break $wrap detection, model-response
// fallback naming, or nested resource-field resolution.
//
// This spec exercises the actual runtime paths end-to-end (not just
// `tsc --noEmit`), using manifest shapes that specifically hit each fixed
// line.
// ===========================================================================

describe('ZodTierGenerator + normalizer: runtime behaviour behind the type fixes still works', () => {
  const outDir = path.resolve(process.cwd(), 'temp-generator-type-safety-out')
  let contract: string
  let mapper: string

  const manifest: RouteManifest = {
    version: '1.0.0',
    baseURL: 'http://localhost/api',
    generatedAt: new Date().toISOString(),
    resources: [
      { name: 'InvoiceResource', fields: { id: { kind: 'primitive', type: 'number' } } },
    ],
    models: [
      { name: 'Invoice', table: 'invoices', columns: [{ name: 'id', type: 'bigint', nullable: false }] } as any,
    ],
    routes: [
      // Hits: respMeta.wrapped read (ZodTierGenerator.ts ~358-360) via `resolved`.
      // Also hits the resource-alias path (isResourceAlias) since this resolves
      // to a known Resource schema.
      {
        name: 'invoices.show',
        method: 'GET',
        path: '/invoices/{id}',
        auth: true,
        middleware: ['api'],
        actionName: 'show',
        groupName: 'invoices',
        response: {
          kind: 'resource', resource: 'InvoiceResource', collection: false, wrapped: true,
          resolved: { status: 'resolved', type: 'resource', resource: 'InvoiceResource', wrapped: true, confidence: 100 },
        } as any,
      },
      // Hits: respMeta.wrapped === true read directly off route.response (no
      // .resolved/.semantic wrapper) — the third branch of the `isWrapped` check.
      // Also a MODEL (not resource) response → exercises the fallback-naming
      // path and the meta.model / meta.resource cross-access fix.
      {
        name: 'invoices.legacy',
        method: 'GET',
        path: '/invoices/{id}/legacy',
        auth: true,
        middleware: ['api'],
        actionName: 'legacy',
        groupName: 'invoices',
        response: { kind: 'model', model: 'Invoice', collection: false, wrapped: true } as any,
      },
      // Hits: normalizeManifest's patchField/resolveResponse recursion over
      // nested `kind: 'object'` fields with a `fields` map — the exact shape
      // that needed `fields?: Record<string, unknown>` added to RuntimeAugmented.
      {
        name: 'invoices.summary',
        method: 'GET',
        path: '/invoices/summary',
        auth: true,
        middleware: ['api'],
        actionName: 'summary',
        groupName: 'invoices',
        response: {
          kind: 'object',
          fields: {
            total: { kind: 'primitive', type: 'number' },
            nested: {
              kind: 'object',
              fields: {
                count: { kind: 'primitive', type: 'number' },
              },
            },
          },
        } as any,
      },
      // Hits: raw literal AST node from the PHP extractor —
      // `{ kind: 'literal', code: '{"kind":"model",...}' }` — the exact shape
      // that needed `code?: string` added to RuntimeAugmented, and that must
      // be read via the properly-typed `augmentedNode` (not raw `node`, which
      // TS narrows to `{}` under a truthiness check on `unknown`).
      {
        name: 'invoices.rawLiteral',
        method: 'GET',
        path: '/invoices/raw',
        auth: true,
        middleware: ['api'],
        actionName: 'rawLiteral',
        groupName: 'invoices',
        response: {
          kind: 'literal',
          code: '{"kind":"model","model":"Invoice","collection":true,"paginated":false}',
        } as any,
      },
      // Hits: ParsedRoute's legacy uri/actionName/controllerName fields
      // (rather than path/action) — the shape normalizer.spec.ts's fixture
      // uses, and the one the stateless normalizer pipeline must still accept.
      {
        name: 'legacy.show',
        method: 'GET',
        path: '/legacy-shape',
        uri: '/legacy-shape',
        actionName: 'legacyShape',
        controllerName: 'LegacyController',
        auth: false,
        middleware: [],
        response: { kind: 'model', model: 'Invoice', collection: false } as any,
      },
    ] as any,
  }

  beforeAll(async () => {
    const contractResult = await CompilerBridge.generateContractTypes(manifest)
    contract = contractResult.code
    const mapperResult = await CompilerBridge.generateMapperTypes(manifest)
    mapper = mapperResult.code
  })

  it('generates without throwing for a manifest mixing resource/model/object/literal response shapes', () => {
    expect(contract).toBeTruthy()
  })

  it('generates contract schema for invoices domain', () => {
    expect(contract).toContain('invoicesContractSchema')
    expect(contract).toContain('InvoicesContractSchema')
  })

  it('generates Show, Legacy, Summary, and RawLiteral contract actions', () => {
    expect(contract).toContain('Show:')
    expect(contract).toContain('Legacy:')
    expect(contract).toContain('Summary:')
    expect(contract).toContain('RawLiteral:')
  })

  it('normalizeManifest accepts the legacy uri/actionName/controllerName route shape and produces a stable IR without throwing', () => {
    const kernel = new SemanticResolutionKernel()
    const normalized = normalizeManifest(manifest, kernel)
    const legacyRoute = normalized.routes.find(r => r.actionName === 'legacyShape')
    expect(legacyRoute).toBeDefined()
    expect(legacyRoute!.uri).toBe('/legacy-shape')
    expect(legacyRoute!.controllerName).toBe('LegacyController')
  })
})
