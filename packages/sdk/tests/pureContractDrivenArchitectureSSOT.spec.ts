import { describe, it, expect } from 'vitest'
import {
  ScannedRouteDescriptor,
  ScannedRouteManifestDescriptor,
  ScannedEndpointContract,
  createEndpointContract,
  getRouteContract,
  getManifestContractMap,
  RouteManifest,
  ParsedRoute,
  HttpMethod,
  CrudRole,
  RouteHookKind,
  HttpErrorKind
} from '@routesync/core'
import { classifyRoutes, ScannedClassifiedRouteDescriptor } from '@routesync/cli/src/generators/route-classifier'
import { SDKGenerator } from '@routesync/cli/src/generators/SDKGenerator'
import { HookGenerator } from '@routesync/cli/src/generators/HookGenerator'

describe('Pure Contract-Driven Architecture (CDA) SSOT Suite', () => {
  const sampleRoute = ScannedRouteDescriptor.create({
    method: 'GET',
    path: '/api/v1/orders',
    resourceName: 'Order',
    crudRole: CrudRole.Index,
    actionName: 'index'
  })

  const sampleMutateRoute = ScannedRouteDescriptor.create({
    method: 'POST',
    path: '/api/v1/orders',
    resourceName: 'Order',
    crudRole: CrudRole.Create,
    actionName: 'store',
    schema: {
      rules: [{ fieldName: 'total', rules: 'required|numeric' }],
      messages: [],
      attributes: []
    }
  })

  it('1. ScannedRouteManifestDescriptor should guarantee frozen top-level manifest.contracts array', () => {
    const manifest = ScannedRouteManifestDescriptor.create({
      routes: [sampleRoute, sampleMutateRoute]
    })

    expect(manifest.contracts).toBeDefined()
    expect(Array.isArray(manifest.contracts)).toBe(true)
    expect(manifest.contracts.length).toBe(2)
    expect(Object.isFrozen(manifest.contracts)).toBe(true)

    expect(manifest.contracts[0].id).toBe('Order.index')
    expect(manifest.contracts[0].method).toBe('GET')
    expect(manifest.contracts[0].path).toBe('/api/v1/orders')
    expect(manifest.contracts[0].isMutating).toBe(false)
    expect(manifest.contracts[0].hookKind).toBe(RouteHookKind.Query)

    expect(manifest.contracts[1].id).toBe('Order.store')
    expect(manifest.contracts[1].method).toBe('POST')
    expect(manifest.contracts[1].isMutating).toBe(true)
    expect(manifest.contracts[1].request.hasBody).toBe(true)
  })

  it('2. getManifestContractMap should provide O(1) contract resolution by ID', () => {
    const manifest = ScannedRouteManifestDescriptor.create({
      routes: [sampleRoute, sampleMutateRoute]
    })

    const map = getManifestContractMap(manifest)
    expect(map).toBeInstanceOf(Map)
    expect(map.size).toBe(2)

    const indexContract = map.get('Order.index')
    expect(indexContract).toBeDefined()
    expect(indexContract?.method).toBe('GET')

    const storeContract = map.get('Order.store')
    expect(storeContract).toBeDefined()
    expect(storeContract?.method).toBe('POST')
  })

  it('3. getRouteContract should guarantee non-null EndpointContract even on partial mock routes', () => {
    const looseRoute = {
      method: 'GET',
      path: '/api/v1/health',
      resourceName: 'Health',
      actionName: 'check'
    } as unknown as ParsedRoute

    const contract = getRouteContract(looseRoute)
    expect(contract).toBeDefined()
    expect(contract).toBeInstanceOf(ScannedEndpointContract)
    expect(contract.id).toBe('Health.check')
    expect(contract.method).toBe('GET')
    expect(contract.path).toBe('/api/v1/health')
    expect(contract.isMutating).toBe(false)
  })

  it('4. ClassifiedRoute should guarantee non-null contract at Origin Boundary', () => {
    const classified = classifyRoutes([sampleRoute, sampleMutateRoute])
    expect(classified.length).toBe(2)

    for (const cr of classified) {
      expect(cr.contract).toBeDefined()
      expect(cr.contract.id).toBeDefined()
      expect(cr.contract.method).toBe(cr.method)
      expect(cr.contract.runtimePath).toBe(cr.runtimePath)
      expect(Object.isFrozen(cr)).toBe(true)
    }
  })

  it('5. SDKGenerator should directly consume route.contract SSOT without defensive fallbacks', async () => {
    const manifest = ScannedRouteManifestDescriptor.create({
      routes: [sampleRoute, sampleMutateRoute]
    })

    const code = await SDKGenerator.generate(manifest, undefined, { zod: true })
    expect(code).toContain('export const api = defineApi({')
    expect(code).toContain('order: {')
    expect(code).toContain('list: endpoint({')
    expect(code).toContain("method: 'GET',")
    expect(code).toContain('create: endpoint({')
    expect(code).toContain("method: 'POST',")
    expect(code).toContain('contract: {')
    expect(code).toContain('response: validateOrderResourceSchema,')
  })

  it('6. HookGenerator should directly consume route.contract SSOT without defensive fallbacks', async () => {
    const manifest = ScannedRouteManifestDescriptor.create({
      routes: [sampleRoute, sampleMutateRoute]
    })

    const code = await HookGenerator.generate(manifest, undefined)
    expect(code).toContain('defineHooks({')
    expect(code).toContain('order: {')
    expect(code).toContain('types: {')
    expect(code).toContain('list: typeOf<')
    expect(code).toContain('detail: typeOf<never>(),')
    expect(code).toContain('create: typeOf<')
  })
})
