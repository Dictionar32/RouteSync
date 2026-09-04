import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs-extra'
import {
  RouteManifest,
  HttpMethod,
  CrudRole,
  ResponseShape,
  HttpStatusCode,
  RouteHookKind,
  RequestContentType,
  createEndpointContract,
  ScannedEndpointContract,
  matchEndpointResponse,
  ScannedRouteDescriptor,
  ResourceResponseDescriptor,
  ScannedRouteCacheInvalidationDescriptor,
  ScannedInvalidationTarget,
  ScannedHttpErrorResponseDescriptor,
  DatabaseColumnKind,
  PrimitiveKind,
  PublicBroadcastChannelDescriptor
} from '@routesync/core'
import { CompilerBridge } from '@routesync/cli/src/generators/CompilerBridge'
import { ConstantsGenerator } from '@routesync/cli/src/generators/ConstantsGenerator'
import { EchoGenerator } from '@routesync/cli/src/generators/EchoGenerator'
import { ModelGenerator } from '@routesync/cli/src/generators/ModelGenerator'

describe('EndpointContract ADT & Unified Compiler Pipeline SSOT', () => {
  const tmpDir = path.join(__dirname, 'tmp-endpoint-cda-test')

  it('1. createEndpointContract should assemble complete immutable EndpointContract from route', () => {
    const mockRoute = ScannedRouteDescriptor.create({
      name: 'orders.show',
      method: 'GET',
      path: '/api/orders/{id}',
      resourceName: 'Order',
      groupName: 'orders',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      crudRole: CrudRole.Show,
      hookKind: RouteHookKind.Query,
      response: ResourceResponseDescriptor.single('OrderResource'),
      errorResponses: [
        ScannedHttpErrorResponseDescriptor.unprocessableEntity(),
        ScannedHttpErrorResponseDescriptor.unauthorized()
      ],
      invalidation: ScannedRouteCacheInvalidationDescriptor.fromTargets([
        ScannedInvalidationTarget.selfList('orders')
      ])
    })

    const contract = createEndpointContract(mockRoute)

    expect(contract).toBeInstanceOf(ScannedEndpointContract)
    expect(contract.id).toBe('orders.show')
    expect(contract.method).toBe('GET')
    expect(contract.crudRole).toBe(CrudRole.Show)
    expect(contract.isMutating).toBe(false)
    expect(contract.hookKind).toBe(RouteHookKind.Query)

    // Request SSOT
    expect(contract.request).toBeDefined()
    expect(contract.request.contentType).toBe(RequestContentType.None)
    expect(contract.request.pathParameters).toBeDefined()

    // Success Response SSOT
    expect(contract.response.success.statusCode).toBe(HttpStatusCode.Ok)
    expect(contract.response.success.readTypeName).toBe('OrderResourceTransformed')
    expect(contract.response.success.validatorName).toBe('validateOrderResourceSchema')
    expect(contract.response.success.mapperName).toBe('toOrderResourceRead')
    expect(contract.response.success.shape).toBe(ResponseShape.Single)

    // Error Responses ADT
    expect(contract.response.errors.length).toBe(2)
    expect(contract.response.errors[0].statusCode).toBe(HttpStatusCode.UnprocessableEntity)
    expect(contract.response.errors[0].typeName).toBe('LaravelValidationError')
    expect(contract.response.errors[1].statusCode).toBe(HttpStatusCode.Unauthorized)
    expect(contract.response.errors[1].typeName).toBe('LaravelUnauthorizedError')
    expect(contract.response.errorUnionType).toBe('LaravelValidationError | LaravelUnauthorizedError')

    // Immutable
    expect(Object.isFrozen(contract)).toBe(true)
    expect(Object.isFrozen(contract.request)).toBe(true)
    expect(Object.isFrozen(contract.response)).toBe(true)
  })

  it('2. matchEndpointResponse should execute pure catamorphism on EndpointResponseContract without if/switch', () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/orders',
      resourceName: 'Order',
      actionName: 'create',
      actionKind: 'create',
      isMutating: true,
      crudRole: CrudRole.Create,
      hookKind: RouteHookKind.Mutation,
      response: ResourceResponseDescriptor.single('OrderResource'),
      errorResponses: [ScannedHttpErrorResponseDescriptor.unprocessableEntity()]
    })

    const contract = createEndpointContract(mockRoute)

    const projected = matchEndpointResponse(contract.response, {
      success: (s) => `SUCCESS:${s.statusCode}:${s.readTypeName}`,
      error: (errors, union) => `ERROR:${union}`
    })

    expect(projected).toBe('SUCCESS:201:OrderResourceTransformed')
  })

  it('3. CompilerBridge.emitFullBundle should atomically emit core contract passes, SDK, constants, query-keys, types, and index', async () => {
    const mockRoute = {
      name: 'orders.store',
      method: 'POST',
      path: '/api/orders',
      actionName: 'store',
      resourceName: 'Order',
      groupName: 'orders',
      crudRole: CrudRole.Create,
      isMutating: true,
      hookKind: RouteHookKind.Mutation,
      runtimePath: '/api/orders',
      schema: {
        rules: [
          {
            fieldName: 'amount',
            rules: 'required|numeric',
            ast: [{ kind: 'required' }, { kind: 'numeric' }]
          }
        ]
      },
      response: ResourceResponseDescriptor.single('OrderResource')
    }

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    await fs.remove(tmpDir)
    await fs.ensureDir(tmpDir)

    const emitted = await CompilerBridge.emitFullBundle(manifest, tmpDir, {
      zod: true,
      hooks: true
    })

    expect(emitted.writtenPaths.length).toBe(5)
    expect(emitted.clientArtifacts.length).toBeGreaterThanOrEqual(6)

    // Check core contracts
    expect(fs.existsSync(path.join(tmpDir, 'types', 'api-read.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'forms', 'api-form.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'contracts', 'api-contract.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'contracts', 'api-field.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'mappers', 'api-mapper.ts'))).toBe(true)

    // Check client artifacts
    expect(fs.existsSync(path.join(tmpDir, 'api.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'constants.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'query-key.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'hooks.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'types', 'index.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'index.ts'))).toBe(true)

    await fs.remove(tmpDir)
  })

  it('4. CompilerBridge.emitFullBundle should conditionally emit Next.js Actions and MSW handlers', async () => {
    const mockRoute = {
      name: 'orders.index',
      method: 'GET',
      path: '/api/orders',
      actionName: 'index',
      resourceName: 'Order',
      groupName: 'orders',
      crudRole: CrudRole.Index,
      isMutating: false,
      hookKind: RouteHookKind.Query,
      runtimePath: '/api/orders',
      response: ResourceResponseDescriptor.collection('OrderResource')
    }

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    await fs.remove(tmpDir)
    await fs.ensureDir(tmpDir)

    const emitted = await CompilerBridge.emitFullBundle(manifest, tmpDir, {
      zod: true,
      hooks: false,
      nextActions: true,
      msw: true
    })

    expect(fs.existsSync(path.join(tmpDir, 'actions.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'mocks.ts'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'hooks.ts'))).toBe(false)

    await fs.remove(tmpDir)
  })

  it('5. ScannedRouteDescriptor.contract should be directly bound and immutable on route descriptor', () => {
    const mockRoute = ScannedRouteDescriptor.create({
      name: 'products.show',
      method: 'GET',
      path: '/api/products/{id}',
      resourceName: 'Product',
      groupName: 'products',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      crudRole: CrudRole.Show,
      hookKind: RouteHookKind.Query,
      response: ResourceResponseDescriptor.single('ProductResource'),
      errorResponses: [
        ScannedHttpErrorResponseDescriptor.unprocessableEntity()
      ]
    })

    expect(mockRoute.contract).toBeDefined()
    expect(mockRoute.contract.id).toBe('products.show')
    expect(mockRoute.contract.crudRole).toBe(CrudRole.Show)
    expect(mockRoute.contract.response.success.readTypeName).toBe('ProductResourceTransformed')
    expect(mockRoute.contract.response.errors.length).toBe(1)
    expect(mockRoute.contract.response.errorUnionType).toBe('LaravelValidationError')
    expect(Object.isFrozen(mockRoute.contract)).toBe(true)
  })

  it('6. ConstantsGenerator should directly consume col.enumValues SSOT', () => {
    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [],
      models: [
        {
          name: 'Order',
          shortName: 'Order',
          columns: [
            {
              name: 'status',
              propertyName: 'status',
              type: 'enum',
              columnKind: DatabaseColumnKind.Enum,
              nullable: false,
              semanticType: PrimitiveKind.STRING,
              enumValues: ['pending', 'processing', 'completed', 'cancelled']
            }
          ]
        }
      ]
    }

    const lines = ConstantsGenerator.getConstantLines(manifest)
    const content = lines.join('\n')

    expect(content).toContain('export const Enums = {')
    expect(content).toContain('Order: {')
    expect(content).toContain('Status: {')
    expect(content).toContain("PENDING: 'pending'")
    expect(content).toContain("COMPLETED: 'completed'")
  })

  it('7. EchoGenerator should use ROUTE_PARAMETER_TYPE_REGISTRY and runtimePattern SSOT', async () => {
    const channel: PublicBroadcastChannelDescriptor = {
      name: 'orders.{orderId}',
      kind: 'public',
      pattern: 'orders.{orderId}',
      runtimePattern: 'orders.${orderId}',
      parameters: [
        {
          name: 'orderId',
          propertyName: 'orderId',
          type: 'number',
          location: 'path',
          required: true
        }
      ],
      isPrivate: false,
      isPresence: false
    }

    const code = await EchoGenerator.generate([channel])
    expect(code).toContain('useListenOrdersChannel<TEvent = unknown>(orderId: number,')
    expect(code).toContain('`orders.${orderId}`')
  })

  it('8. ModelGenerator should use DATABASE_COLUMN_KIND_REGISTRY tsType mapping', async () => {
    const manifest: any = {
      models: [
        {
          name: 'Product',
          shortName: 'Product',
          columns: [
            {
              name: 'id',
              propertyName: 'id',
              type: 'bigint(20) unsigned',
              columnKind: DatabaseColumnKind.BigInt,
              nullable: false,
              semanticType: PrimitiveKind.NUMBER,
              enumValues: []
            },
            {
              name: 'is_active',
              propertyName: 'isActive',
              type: 'tinyint(1)',
              columnKind: DatabaseColumnKind.Boolean,
              nullable: false,
              semanticType: PrimitiveKind.BOOLEAN,
              enumValues: []
            }
          ]
        }
      ]
    }

    await fs.remove(tmpDir)
    await fs.ensureDir(tmpDir)
    await ModelGenerator.generate(manifest, tmpDir)

    const modelFile = await fs.readFile(path.join(tmpDir, 'core', 'models.ts'), 'utf-8')
    expect(modelFile).toContain('export interface Product {')
    expect(modelFile).toContain('id: number')
    expect(modelFile).toContain('isActive: boolean')

    await fs.remove(tmpDir)
  })
})
