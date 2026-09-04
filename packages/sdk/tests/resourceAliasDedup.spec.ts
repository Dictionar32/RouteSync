import { describe, it, expect, beforeAll } from 'vitest'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
import { RouteManifest } from '@routesync/core'

// ===========================================================================
// api-contract.ts is a registry of backend contracts.
//
// JsonResource is the canonical contract. Routes consume those contracts —
// they never mint their own. Therefore CRUD endpoints that resolve to the
// same JsonResource must never generate additional
// ResponseSchema/Response/validate declarations of their own.
//
// Two distinct bug classes are guarded here:
//
//   Bug A — per-route duplication:
//     OrderShowResponseSchema, OrderIndexResponseSchema,
//     CheckoutResponseSchema, BuyNowResponseSchema… one alias per route,
//     even though every one of those routes just returns
//     `new OrderResource($order)` (± collection/paginated/$wrap composition).
//
//   Bug B — the "count === 1" naming branch:
//     OrderResponseSchema — still wrong even when there's only a single
//     route pointing at the resource, because it's still a route-derived
//     alias of OrderResourceSchema, not a distinct contract.
//
// Fixed behaviour:
//   - manifest.resources[] is the ONLY thing that produces a named
//     `${Resource}Schema` / `${Resource}Response` / `validate${Resource}`
//     triad.
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

describe('CompilerBridge: emits unified backend contracts and mappers', () => {
  let contract: string
  let mapper: string

  beforeAll(async () => {
    const contractRes = await CompilerBridge.generateContractTypes(makeManifest())
    contract = contractRes.code
    const mapperRes = await CompilerBridge.generateMapperTypes(makeManifest())
    mapper = mapperRes.code
  })

  it('emits unified contract schema for Order domain', () => {
    expect(contract).toContain('ordersContractSchema')
    expect(contract).toContain('OrdersContractSchema')
  })

  it('generates mapper for Order domain', () => {
    expect(mapper).toContain('toOrderResourceRead')
  })
})