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
  ScannedRouteCacheInvalidationDescriptor,
  ScannedInvalidationTarget,
  ScannedRouteDescriptor
} from '../../core/src'
import { HookGenerator } from '../../cli/src/generators/HookGenerator'
import { SDKGenerator } from '../../cli/src/generators/SDKGenerator'

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

  it('3. SDKGenerator should consume route.response.readTypeName and mapperName directly without string heuristics', async () => {
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

    const manifest: any = {
      baseURL: 'http://localhost/api',
      routes: [mockRoute]
    }

    const sdkCode = await SDKGenerator.generate(manifest)
    expect(sdkCode).toContain('toUserResourceRead')
    expect(sdkCode).toContain('response: toUserResourceRead')
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
})
