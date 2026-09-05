import { describe, it, expect } from 'vitest'
import {
  DataProvenanceKind,
  DATA_PROVENANCE_REGISTRY,
  matchDataProvenance,
  ProvenanceSourceRef,
  DataProvenanceVisitor,
  ScannedEndpointProvenanceDescriptor,
  ScannedEndpointContract,
  ScannedRouteDescriptor,
  ResourceResponseDescriptor,
  getRouteContract
} from '../../core/src'
import { SDKGenerator } from '../../cli/src/generators/SDKGenerator'
import { HookGenerator } from '../../cli/src/generators/HookGenerator'

describe('End-to-End Data Provenance SSOT', () => {
  it('1. DATA_PROVENANCE_REGISTRY should exhaustively define all 6 provenance kinds', () => {
    const kinds = Object.values(DataProvenanceKind)
    expect(kinds).toEqual([
      'route_definition',
      'controller_action',
      'form_request',
      'eloquent_model',
      'json_resource',
      'inferred'
    ])

    for (const kind of kinds) {
      const spec = DATA_PROVENANCE_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.category).toBe('string')
      expect(typeof spec.isSourceLinked).toBe('boolean')
      expect(typeof spec.description).toBe('string')
    }

    expect(DATA_PROVENANCE_REGISTRY[DataProvenanceKind.RouteDefinition].isSourceLinked).toBe(true)
    expect(DATA_PROVENANCE_REGISTRY[DataProvenanceKind.Inferred].isSourceLinked).toBe(false)
  })

  it('2. matchDataProvenance catamorphism should dispatch exhaustively for all kinds', () => {
    const visitor: DataProvenanceVisitor<string> = {
      route_definition: ref => `route:${ref.symbol}`,
      controller_action: ref => `controller:${ref.symbol}`,
      form_request: ref => `request:${ref.symbol}`,
      eloquent_model: ref => `model:${ref.symbol}`,
      json_resource: ref => `resource:${ref.symbol}`,
      inferred: ref => `inferred:${ref.symbol}`
    }

    const routeRef: ProvenanceSourceRef = {
      kind: DataProvenanceKind.RouteDefinition,
      file: 'routes/api.php',
      line: 25,
      symbol: 'GET /orders'
    }
    expect(matchDataProvenance(routeRef, visitor)).toBe('route:GET /orders')

    const ctrlRef: ProvenanceSourceRef = {
      kind: DataProvenanceKind.ControllerAction,
      file: 'app/Http/Controllers/OrderController.php',
      line: 15,
      symbol: 'OrderController@index'
    }
    expect(matchDataProvenance(ctrlRef, visitor)).toBe('controller:OrderController@index')

    const formRef: ProvenanceSourceRef = {
      kind: DataProvenanceKind.FormRequest,
      file: 'app/Http/Requests/StoreOrderRequest.php',
      line: 1,
      symbol: 'StoreOrderRequest'
    }
    expect(matchDataProvenance(formRef, visitor)).toBe('request:StoreOrderRequest')

    const modelRef: ProvenanceSourceRef = {
      kind: DataProvenanceKind.EloquentModel,
      file: 'app/Models/Order.php',
      line: 1,
      symbol: 'Order'
    }
    expect(matchDataProvenance(modelRef, visitor)).toBe('model:Order')

    const resourceRef: ProvenanceSourceRef = {
      kind: DataProvenanceKind.JsonResource,
      file: 'app/Http/Resources/OrderResource.php',
      line: 1,
      symbol: 'OrderResource'
    }
    expect(matchDataProvenance(resourceRef, visitor)).toBe('resource:OrderResource')

    // String discriminator dispatch
    expect(matchDataProvenance(DataProvenanceKind.Inferred, visitor)).toContain('inferred:')
  })

  it('3. ScannedEndpointProvenanceDescriptor factories should build immutable provenance contracts', () => {
    const desc = ScannedEndpointProvenanceDescriptor.create({
      route: {
        kind: DataProvenanceKind.RouteDefinition,
        file: 'routes/api.php',
        line: 42,
        symbol: 'POST /checkout'
      },
      controller: {
        kind: DataProvenanceKind.ControllerAction,
        file: 'app/Http/Controllers/CheckoutController.php',
        line: 20,
        symbol: 'CheckoutController@process'
      },
      request: {
        kind: DataProvenanceKind.FormRequest,
        file: 'app/Http/Requests/CheckoutRequest.php',
        line: 1,
        symbol: 'CheckoutRequest'
      }
    })

    expect(desc.route.file).toBe('routes/api.php')
    expect(desc.route.line).toBe(42)
    expect(desc.controller?.symbol).toBe('CheckoutController@process')
    expect(desc.request?.symbol).toBe('CheckoutRequest')
    expect(desc.response).toBeNull()
    expect(desc.summary).toContain('Route: routes/api.php:42')
    expect(desc.summary).toContain('Controller: app/Http/Controllers/CheckoutController.php:20')
    expect(desc.summary).toContain('Request: app/Http/Requests/CheckoutRequest.php:1')

    const inferred = ScannedEndpointProvenanceDescriptor.inferred('/health', 'GET')
    expect(inferred.route.kind).toBe(DataProvenanceKind.Inferred)
    expect(inferred.summary).toBe('Inferred: GET /health')
  })

  it('4. ScannedEndpointContract.fromRoute should auto-assemble complete provenance references', () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/v1/users/{id}',
      resourceName: 'User',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      response: ResourceResponseDescriptor.single('UserResource'),
      sourceFile: 'routes/api.php',
      sourceLine: 88,
      controllerName: 'UserController'
    })

    const contract = ScannedEndpointContract.fromRoute(mockRoute)
    expect(contract.provenance).toBeDefined()
    expect(contract.provenance.route.file).toBe('routes/api.php')
    expect(contract.provenance.route.line).toBe(88)
    expect(contract.provenance.controller?.symbol).toBe('UserController@show')
    expect(contract.provenance.response?.symbol).toBe('UserResource')
    expect(contract.provenance.response?.file).toBe('app/Http/Resources/UserResource.php')
    expect(contract.provenance.summary).toContain('Route: routes/api.php:88')
    expect(contract.provenance.summary).toContain('Controller: routes/api.php:88 (UserController@show)')
    expect(contract.provenance.summary).toContain('Response: app/Http/Resources/UserResource.php:1 (UserResource)')
  })

  it('5. SDKGenerator should emit @provenance and @see JSDoc tags above endpoint declarations', async () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/orders/{id}',
      resourceName: 'Order',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      response: ResourceResponseDescriptor.single('OrderResource'),
      sourceFile: 'routes/api.php',
      sourceLine: 55,
      controllerName: 'OrderController'
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    const sdkCode = await SDKGenerator.generate(manifest)
    expect(sdkCode).toContain('* @provenance Route: routes/api.php:55')
    expect(sdkCode).toContain('* @see routes/api.php#L55')
    expect(sdkCode).toContain('get: endpoint({')
  })

  it('6. HookGenerator should emit @provenance and @see JSDoc tags above exported hooks', async () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/orders/{id}',
      resourceName: 'Order',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      response: ResourceResponseDescriptor.single('OrderResource'),
      sourceFile: 'routes/api.php',
      sourceLine: 55,
      controllerName: 'OrderController'
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    const hookCode = await HookGenerator.generate(manifest)
    expect(hookCode).toContain('* @provenance Route: routes/api.php:55')
    expect(hookCode).toContain('* @see routes/api.php#L55')
    expect(hookCode).toContain('export const useOrder = hooks.order')
  })
})
