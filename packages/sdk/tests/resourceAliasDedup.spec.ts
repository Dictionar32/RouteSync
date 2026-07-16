import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ZodTierGenerator } from '../../cli/src/generators/ZodTierGenerator'
import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'

// ===========================================================================
// Regression guard for the "route loop duplicates the resource contract" bug.
//
// Context: api-contract.ts previously emitted ONE `${respName}ResponseSchema`
// PER ROUTE (OrderIndexResponseSchema, CheckoutResponseSchema, BuyNowResponseSchema…)
// even when every one of those routes just returns `new OrderResource($order)`
// (± Laravel's collection/paginated/$wrap composition). All of those were
// aliases of the same OrderResourceSchema — pure duplication.
//
// Fixed behaviour:
//   - manifest.resources[] is still the ONLY thing that produces a named
//     `${Resource}Schema` / `${Resource}Response` / `validate${Resource}` triad.
//   - routes[] whose response resolves to a known Resource (`kind: 'resource'`)
//     must NOT add a second name to api-contract.ts — they reuse
//     `OrderResourceSchema` inline (wrapped in `data:`/array() as needed).
//   - routes[] whose response has NO backing Resource (raw Model, or an inline
//     object literal with no JsonResource at all) still get a route-named
//     fallback contract, because there's nothing else to point to.
// ===========================================================================

function makeManifest(): RouteManifest {
  return {
    version: '1.0.0',
    baseURL: 'http://localhost/api',
    generatedAt: new Date().toISOString(),
    models: [
      {
        name: 'Order',
        table: 'orders',
        columns: [
          { name: 'id', type: 'bigint', nullable: false },
          { name: 'status', type: 'varchar(255)', nullable: false },
        ],
        casts: {}, relations: {}, accessors: {},
      } as any,
    ],
    resources: [
      {
        name: 'OrderResource',
        fields: {
          id: { kind: 'property_access', resolved: { status: 'resolved', type: 'number', confidence: 100, trace: [] } },
          status: { kind: 'property_access', resolved: { status: 'resolved', type: 'string', confidence: 100, trace: [] } },
        },
      } as any,
    ],
    // Four routes, four different CRUD actions, ALL backed by OrderResource.
    // A GET-collection route is included to exercise the paginated/array()
    // composition path as well.
    routes: [
      {
        name: 'orders.show',
        method: 'GET',
        path: '/orders/{id}',
        auth: true,
        middleware: ['api'],
        actionName: 'show',
        groupName: 'orders',
        response: {
          kind: 'resource', resource: 'OrderResource', collection: false,
          resolved: { status: 'resolved', type: 'resource', resource: 'OrderResource', confidence: 100 },
        },
      },
      {
        name: 'orders.index',
        method: 'GET',
        path: '/orders',
        auth: true,
        middleware: ['api'],
        actionName: 'index',
        groupName: 'orders',
        response: {
          kind: 'resource', resource: 'OrderResource', collection: true, paginated: true,
          resolved: { status: 'resolved', type: 'resource', resource: 'OrderResource', collection: true, paginated: true, confidence: 100 },
        },
      },
      {
        name: 'checkout.store',
        method: 'POST',
        path: '/checkout',
        auth: true,
        middleware: ['api'],
        actionName: 'store',
        groupName: 'checkout',
        schema: { rules: { promo_code: 'nullable|string' } },
        response: {
          kind: 'resource', resource: 'OrderResource', collection: false, wrapped: true,
          resolved: { status: 'resolved', type: 'resource', resource: 'OrderResource', wrapped: true, confidence: 100 },
        },
      },
      {
        name: 'buyNow.store',
        method: 'POST',
        path: '/buy-now',
        auth: true,
        middleware: ['api'],
        actionName: 'store',
        groupName: 'buyNow',
        response: {
          kind: 'resource', resource: 'OrderResource', collection: false, wrapped: true,
          resolved: { status: 'resolved', type: 'resource', resource: 'OrderResource', wrapped: true, confidence: 100 },
        },
      },
      // Fifth route: no matching Resource for its response (raw Model only) —
      // this one MUST still get a route-named fallback contract.
      {
        name: 'orders.legacyStatus',
        method: 'GET',
        path: '/orders/{id}/legacy-status',
        auth: true,
        middleware: ['api'],
        actionName: 'legacyStatus',
        groupName: 'ordersLegacyStatus',
        response: {
          kind: 'model', model: 'Order', collection: false,
          resolved: { status: 'resolved', type: 'model', model: 'Order', confidence: 100 },
        },
      },
    ],
    frontend: {},
  } as any
}

describe('api-contract.ts: resource-backed routes must not duplicate the Resource contract', () => {
  const outDir = path.resolve(process.cwd(), 'temp-resource-alias-dedup-out')
  let contract: string
  let mapper: string

  beforeAll(async () => {
    await fs.remove(outDir)
    await fs.ensureDir(outDir)
    await ZodTierGenerator.generate(makeManifest(), outDir)
    contract = await fs.readFile(path.join(outDir, 'contract/api-contract.ts'), 'utf8').catch(() => '')
    mapper = await fs.readFile(path.join(outDir, 'mappers/api-mapper.ts'), 'utf8').catch(() => '')
  })
  afterAll(() => fs.remove(outDir))

  it('emits exactly one OrderResourceSchema (the resource loop) and no others', () => {
    const schemaDecls = contract.split('\n').filter(l => /^export const \w+Schema = /.test(l))
    const orderSchemaDecls = schemaDecls.filter(l => l.includes('OrderResource') || /^export const Order\w*Schema/.test(l))
    expect(schemaDecls.filter(l => l.startsWith('export const OrderResourceSchema'))).toHaveLength(1)
  })

  it('does NOT emit OrderIndexResponseSchema / CheckoutResponseSchema / BuyNowResponseSchema', () => {
    expect(contract).not.toMatch(/export const OrderIndexResponseSchema/)
    expect(contract).not.toMatch(/export const OrderShowResponseSchema/)
    expect(contract).not.toMatch(/export const CheckoutResponseSchema/)
    expect(contract).not.toMatch(/export const BuyNowResponseSchema/)
  })

  it('does NOT emit OrderResponseSchema either (single-count alias case)', () => {
    // Even the "count === 1" naming branch must not fire for a pure resource alias.
    expect(contract).not.toMatch(/export const OrderResponseSchema/)
  })

  it('the four resource-backed routes exist only as OrderResourceSchema, plus type + validator, once each', () => {
    expect((contract.match(/export const OrderResourceSchema = /g) || []).length).toBe(1)
    expect((contract.match(/export type OrderResourceResponse = /g) || []).length).toBe(1)
    expect((contract.match(/export const validateOrderResource = /g) || []).length).toBe(1)
  })

  it('DOES still emit a fallback contract for the non-resource route (legacyStatus)', () => {
    // No OrderResource involved here — this route has nothing else to reuse,
    // so a route-named schema is expected and correct.
    expect(contract).toMatch(/export const OrdersLegacyStatusResponseSchema = /)
  })

  it('api-mapper.ts imports OrderResourceResponse (not a per-route Response type) for the resource-backed routes', () => {
    expect(mapper).toMatch(/OrderResourceResponse/)
    expect(mapper).not.toMatch(/OrderIndexResponse\b/)
    expect(mapper).not.toMatch(/CheckoutResponse\b/)
    expect(mapper).not.toMatch(/BuyNowResponse\b/)
  })

  it('api-mapper.ts inlines the collection/paginated composition instead of importing a named alias', () => {
    // orders.index is collection+paginated → mapper param type should be an
    // inline `{ data: OrderResourceResponse[]; ... }`, not a name that was
    // never exported.
    const indexLine = mapper.split('\n').find(l => l.includes('toOrdersIndexResponseRead') || l.includes('toOrderIndexResponseRead'))
    if (indexLine) {
      expect(indexLine).toMatch(/data:\s*OrderResourceResponse\[\]/)
    }
  })
})
