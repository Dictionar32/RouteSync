import { describe, it, expect } from 'vitest'
import {
  PaginationKind,
  PaginatedEnvelopeDescriptor,
  PolymorphicRelationDescriptor,
  ResourceResponseDescriptor,
  ResponseShape,
  ParsedRoute,
  RequestContentType,
  RouteSecurityClassifier,
  RouteHookKind,
  CrudRole,
  ScannedRouteCacheInvalidationDescriptor,
  ScannedInvalidationTarget,
  RouteParameterType,
  ScannedRouteParameterDescriptor,
  ScannedRouteDescriptor
} from '../../core/src'
import { HookGenerator } from '../../cli/src/generators/HookGenerator'
import { SDKGenerator } from '../../cli/src/generators/SDKGenerator'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
import { QueryKeyGenerator } from '../../cli/src/generators/QueryKeyGenerator'
import { TypeGenerator } from '../../cli/src/generators/TypeGenerator'
import path from 'path'
import fs from 'fs-extra'

describe('Downstream Pure Consumer & Manifest Descriptors SSOT', () => {
  it('1. PaginatedEnvelopeDescriptor should preserve length-aware and cursor pagination metadata', () => {
    const lengthAware: PaginatedEnvelopeDescriptor = {
      kind: PaginationKind.LengthAware,
      dataKey: 'data',
      metaKey: 'meta',
      linksKey: 'links',
      envelopeTypeName: 'PaginatedResponse<UserResourceTransformed>'
    }
    expect(lengthAware.kind).toBe('length_aware')
    expect(lengthAware.dataKey).toBe('data')
    expect(lengthAware.envelopeTypeName).toBe('PaginatedResponse<UserResourceTransformed>')

    const cursor: PaginatedEnvelopeDescriptor = {
      kind: PaginationKind.Cursor,
      dataKey: 'data',
      metaKey: 'meta',
      envelopeTypeName: 'CursorPaginatedResponse<ProductResourceTransformed>'
    }
    expect(cursor.kind).toBe('cursor')
    expect(cursor.linksKey).toBeUndefined()
  })

  it('2. PolymorphicRelationDescriptor should model morphTo and morphMany as discriminated union metadata', () => {
    const morphRel: PolymorphicRelationDescriptor = {
      morphType: 'morphTo',
      idColumn: 'commentable_id',
      typeColumn: 'commentable_type',
      targetModels: ['Post', 'Video'],
      unionTypeName: 'CommentableTarget'
    }

    expect(morphRel.morphType).toBe('morphTo')
    expect(morphRel.idColumn).toBe('commentable_id')
    expect(morphRel.typeColumn).toBe('commentable_type')
    expect(morphRel.targetModels).toEqual(['Post', 'Video'])
    expect(morphRel.unionTypeName).toBe('CommentableTarget')
  })

  it('3. SDKGenerator should consume route.response.readTypeName, mapperName, and validatorName directly without string heuristics', async () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users/{id}',
      resourceName: 'User',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      response: ResourceResponseDescriptor.single('UserResource')
    })

    expect(mockRoute.response.readTypeName).toBe('UserResourceTransformed')
    expect(mockRoute.response.mapperName).toBe('toUserResourceRead')
    expect(mockRoute.response.validatorName).toBe('validateUserResourceSchema')

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    const sdkCode = await SDKGenerator.generate(manifest)
    expect(sdkCode).toContain('toUserResourceRead')
    expect(sdkCode).toContain('response: toUserResourceRead')

    const sdkZodCode = await SDKGenerator.generate(manifest, undefined, { zod: true })
    expect(sdkZodCode).toContain('validateUserResourceSchema')
    expect(sdkZodCode).toContain('response: validateUserResourceSchema')
  })

  it('4. HookGenerator should consume route.response.readTypeName directly from SSOT', async () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/orders/{id}',
      resourceName: 'Order',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      response: ResourceResponseDescriptor.single('OrderResource')
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    const hooksCode = await HookGenerator.generate(manifest)
    expect(hooksCode).toContain('OrderResourceTransformed')
  })

  it('5. HookGenerator should consume route.invalidation.queryKeyExpressions directly from explicit descriptor', async () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/orders',
      resourceName: 'Order',
      actionName: 'create',
      actionKind: 'create',
      isMutating: true,
      invalidation: ScannedRouteCacheInvalidationDescriptor.fromTargets([
        ScannedInvalidationTarget.selfList('orders'),
        ScannedInvalidationTarget.parentList('users')
      ]),
      response: ResourceResponseDescriptor.single('OrderResource')
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    const hooksCode = await HookGenerator.generate(manifest)
    expect(hooksCode).toContain('QueryKey.orders.all')
    expect(hooksCode).toContain('QueryKey.users.lists')
  })

  it('6. HookGenerator should resolve list and detail types purely from response descriptors without intermediate artifact maps', async () => {
    const indexRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/products',
      resourceName: 'Product',
      actionName: 'index',
      actionKind: 'read',
      isMutating: false,
      crudRole: CrudRole.Index,
      response: ResourceResponseDescriptor.collection('ProductResource')
    })
    const showRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/products/{id}',
      resourceName: 'Product',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      crudRole: CrudRole.Show,
      response: ResourceResponseDescriptor.single('ProductResource')
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [indexRoute, showRoute]
    }

    const hooksCode = await HookGenerator.generate(manifest)
    expect(hooksCode).toContain('ProductResourceTransformed')
    expect(hooksCode).toContain('list: typeOf<ProductResourceTransformed>()')
    expect(hooksCode).toContain('detail: typeOf<ProductResourceTransformed>()')
  })

  it('7. CompilerBridge.compileAll should execute all 5 passes and return a coherent CompiledContractsBundle', async () => {
    const mockRoute = {
      name: 'orders.store',
      method: 'POST',
      path: '/api/orders',
      actionName: 'store',
      groupName: 'orders',
      schema: {
        rules: {
          product_id: 'required|integer',
          quantity: 'required|integer|min:1'
        }
      },
      response: {
        kind: 'resource',
        resource: 'OrderResource',
        readTypeName: 'OrderResourceTransformed',
        mapperName: 'toOrderResourceRead',
        validatorName: 'validateOrderResourceSchema'
      }
    }

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute],
      models: [
        {
          name: 'Order',
          table: 'orders',
          columns: [
            { name: 'id', type: 'bigint', nullable: false },
            { name: 'product_id', type: 'bigint', nullable: false },
            { name: 'quantity', type: 'integer', nullable: false }
          ],
          casts: {},
          relations: {},
          accessors: {}
        }
      ],
      resources: [
        {
          name: 'OrderResource',
          model: 'Order',
          fields: {
            id: { type: 'number' },
            productId: { type: 'number' },
            quantity: { type: 'number' }
          }
        }
      ]
    }

    const bundle = await CompilerBridge.compileAll(manifest)
    expect(bundle.readTypes.code).toContain('OrderResourceTransformed')
    expect(bundle.formTypes.code).toContain('OrdersForm')
    expect(bundle.contracts.code).toContain('ordersContractSchema')
    expect(bundle.apiFields.code).toBeDefined()
    expect(bundle.mappers.code).toBeDefined()
  })

  it('8. CompilerBridge.emitAll should write all 5 compiler artifacts to target directory', async () => {
    const mockRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/orders',
      resourceName: 'Order',
      actionName: 'index',
      actionKind: 'read',
      isMutating: false,
      crudRole: CrudRole.Index,
      response: ResourceResponseDescriptor.collection('OrderResource')
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute],
      models: [],
      resources: []
    }

    const tempDir = path.join(__dirname, 'temp_cda_emit')
    try {
      const result = await CompilerBridge.emitAll(manifest, tempDir)
      expect(result.writtenPaths.length).toBe(5)

      for (const writtenPath of result.writtenPaths) {
        expect(await fs.pathExists(writtenPath)).toBe(true)
      }

      const readCode = await fs.readFile(path.join(tempDir, 'types', 'api-read.ts'), 'utf-8')
      expect(readCode).toContain('OrderResourceTransformed')
    } finally {
      await fs.remove(tempDir)
    }
  })

  it('9. QueryKeyGenerator should resolve primary key type from route pathParameters SSOT without fuzzy model matching', async () => {
    const indexRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/devices',
      resourceName: 'Device',
      actionName: 'index',
      actionKind: 'read',
      isMutating: false,
      crudRole: CrudRole.Index,
      response: ResourceResponseDescriptor.collection('DeviceResource')
    })

    const showRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/devices/{id}',
      resourceName: 'Device',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false,
      crudRole: CrudRole.Show,
      pathParameters: [
        ScannedRouteParameterDescriptor.path({
          name: 'id',
          propertyName: 'id',
          type: RouteParameterType.Uuid
        })
      ],
      response: ResourceResponseDescriptor.single('DeviceResource')
    })

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [indexRoute, showRoute],
      models: [] // No models defined, relies 100% on route pathParameters SSOT
    }

    let writtenCode = ''
    const originalWriteFile = fs.writeFile
    ;(fs as any).writeFile = async (_file: string, content: string) => {
      writtenCode = content
    }

    try {
      await QueryKeyGenerator.generate(manifest, '/tmp')
      // Since type is RouteParameterType.Uuid, tsType is 'string'
      expect(writtenCode).toContain('createBaseQueryKey<typeof Entity.DEVICE, string>(Entity.DEVICE)')
    } finally {
      ;(fs as any).writeFile = originalWriteFile
    }
  })

  it('10. TypeGenerator should re-export forms from ../forms/api-form and read from ./api-read', async () => {
    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: []
    }

    const tempDir = path.join(__dirname, 'temp_type_gen')
    try {
      await TypeGenerator.generate(manifest, tempDir)
      const indexCode = await fs.readFile(path.join(tempDir, 'types', 'index.ts'), 'utf-8')
      expect(indexCode).toContain("export * from './api-read'")
      expect(indexCode).toContain("export * from '../forms/api-form'")
    } finally {
      await fs.remove(tempDir)
    }
  })
})
