import { describe, test, expect } from 'vitest'
import {
  CrudRole,
  CRUD_ROLE_REGISTRY,
  matchCrudRole,
  CrudRoleVisitor,
  ScannedCrudRoleDescriptor,
  HttpMethod,
  RouteHookKind,
  RouteActionKind
} from '../../core/src'
import { classifyRoutes } from '../../cli/src/generators/route-classifier'
import type { ParsedRoute } from '../../core/src'

describe('CrudRole ADT Flow SSOT (Pure Functional Catamorphism Suite)', () => {
  test('1. CRUD_ROLE_REGISTRY is immutable and exhaustively maps all CrudRole variants', () => {
    expect(Object.isFrozen(CRUD_ROLE_REGISTRY)).toBe(true)

    const expectedRoles: CrudRole[] = [
      CrudRole.Index,
      CrudRole.Show,
      CrudRole.Create,
      CrudRole.Update,
      CrudRole.Delete,
      CrudRole.Custom
    ]

    for (const role of expectedRoles) {
      const spec = CRUD_ROLE_REGISTRY[role]
      expect(spec).toBeDefined()
      expect(spec.role).toBe(role)
      expect(typeof spec.isMutating).toBe('boolean')
      expect(typeof spec.isCollection).toBe('boolean')
      expect(typeof spec.isItem).toBe('boolean')
      expect(typeof spec.affectsSingleResource).toBe('boolean')
      expect(typeof spec.defaultActionName).toBe('string')
      expect(typeof spec.description).toBe('string')
      expect(spec.defaultHttpMethod).toBeDefined()
      expect(spec.defaultHookKind).toBeDefined()
      expect(spec.defaultActionKind).toBeDefined()
    }
  })

  test('2. matchCrudRole executes pure catamorphism for query roles (index, show)', () => {
    const visitor: CrudRoleVisitor<string> = {
      index: (spec) => `QUERY:${spec.role}:${spec.isCollection}:${spec.defaultActionName}`,
      show: (spec) => `QUERY:${spec.role}:${spec.isItem}:${spec.defaultActionName}`,
      create: () => 'MUTATING',
      update: () => 'MUTATING',
      delete: () => 'MUTATING',
      custom: () => 'CUSTOM'
    }

    expect(matchCrudRole(CrudRole.Index, visitor)).toBe('QUERY:index:true:list')
    expect(matchCrudRole(CrudRole.Show, visitor)).toBe('QUERY:show:true:get')
  })

  test('3. matchCrudRole executes pure catamorphism for mutation roles (create, update, delete)', () => {
    const visitor: CrudRoleVisitor<string> = {
      index: () => 'QUERY',
      show: () => 'QUERY',
      create: (spec) => `MUT:${spec.role}:${spec.affectsSingleResource}:${spec.defaultActionName}`,
      update: (spec) => `MUT:${spec.role}:${spec.affectsSingleResource}:${spec.defaultActionName}`,
      delete: (spec) => `MUT:${spec.role}:${spec.affectsSingleResource}:${spec.defaultActionName}`,
      custom: () => 'CUSTOM'
    }

    expect(matchCrudRole(CrudRole.Create, visitor)).toBe('MUT:create:false:create')
    expect(matchCrudRole(CrudRole.Update, visitor)).toBe('MUT:update:true:update')
    expect(matchCrudRole(CrudRole.Delete, visitor)).toBe('MUT:delete:true:remove')
  })

  test('4. matchCrudRole accepts route objects, raw strings, and falls back to custom gracefully', () => {
    const routeLike = { crudRole: CrudRole.Show, path: '/api/orders/{id}' }

    const fromObj = matchCrudRole(routeLike, {
      index: () => 'LIST',
      show: (spec) => `SHOW:${spec.defaultHttpMethod}`,
      create: () => 'CREATE',
      update: () => 'UPDATE',
      delete: () => 'DELETE',
      custom: () => 'CUSTOM'
    })
    expect(fromObj).toBe(`SHOW:${HttpMethod.GET}`)

    const fromRawString = matchCrudRole('index', {
      index: () => 'INDEX_SUCCESS',
      show: () => 'NO',
      create: () => 'NO',
      update: () => 'NO',
      delete: () => 'NO',
      custom: () => 'NO'
    })
    expect(fromRawString).toBe('INDEX_SUCCESS')

    const fromUnknown = matchCrudRole('unrecognized_action' as any, {
      index: () => 'NO',
      show: () => 'NO',
      create: () => 'NO',
      update: () => 'NO',
      delete: () => 'NO',
      custom: (spec) => `FALLBACK:${spec.role}`
    })
    expect(fromUnknown).toBe('FALLBACK:custom')
  })

  test('5. ScannedCrudRoleDescriptor static factory methods instantiate frozen domain descriptors', () => {
    const indexDesc = ScannedCrudRoleDescriptor.index()
    expect(indexDesc.role).toBe('index')
    expect(indexDesc.isCollection).toBe(true)
    expect(indexDesc.isMutating).toBe(false)
    expect(indexDesc.defaultActionName).toBe('list')
    expect(indexDesc.defaultHookKind).toBe(RouteHookKind.Query)
    expect(Object.isFrozen(indexDesc)).toBe(true)

    const showDesc = ScannedCrudRoleDescriptor.show()
    expect(showDesc.role).toBe('show')
    expect(showDesc.isItem).toBe(true)
    expect(showDesc.affectsSingleResource).toBe(true)
    expect(showDesc.defaultActionName).toBe('get')
    expect(Object.isFrozen(showDesc)).toBe(true)

    const createDesc = ScannedCrudRoleDescriptor.create()
    expect(createDesc.role).toBe('create')
    expect(createDesc.isMutating).toBe(true)
    expect(createDesc.defaultActionName).toBe('create')
    expect(createDesc.defaultHttpMethod).toBe(HttpMethod.POST)
    expect(Object.isFrozen(createDesc)).toBe(true)

    const updateDesc = ScannedCrudRoleDescriptor.update()
    expect(updateDesc.role).toBe('update')
    expect(updateDesc.isMutating).toBe(true)
    expect(updateDesc.affectsSingleResource).toBe(true)
    expect(updateDesc.defaultHttpMethod).toBe(HttpMethod.PUT)
    expect(Object.isFrozen(updateDesc)).toBe(true)

    const deleteDesc = ScannedCrudRoleDescriptor.delete()
    expect(deleteDesc.role).toBe('delete')
    expect(deleteDesc.isMutating).toBe(true)
    expect(deleteDesc.affectsSingleResource).toBe(true)
    expect(deleteDesc.defaultHttpMethod).toBe(HttpMethod.DELETE)
    expect(Object.isFrozen(deleteDesc)).toBe(true)

    const customDesc = ScannedCrudRoleDescriptor.custom()
    expect(customDesc.role).toBe('custom')
    expect(customDesc.defaultActionName).toBe('call')
    expect(Object.isFrozen(customDesc)).toBe(true)

    const fromRoleDesc = ScannedCrudRoleDescriptor.fromRole(CrudRole.Index)
    expect(fromRoleDesc.role).toBe('index')
    expect(fromRoleDesc.isCollection).toBe(true)
  })

  test('6. classifyRoutes integrates seamlessly with CRUD_ROLE_REGISTRY', () => {
    const mockRoutes: ParsedRoute[] = [
      {
        name: 'produk.index',
        method: 'GET',
        path: '/produk',
        runtimePath: '/produk',
        groupName: 'produk',
        actionName: 'index',
        actionKind: RouteActionKind.Read,
        crudRole: CrudRole.Index,
        isMutating: false,
        hookKind: RouteHookKind.Query,
        pathParameters: [],
        queryParameters: [],
        security: [],
        middleware: [],
        responses: []
      } as any,
      {
        name: 'produk.show',
        method: 'GET',
        path: '/produk/{id}',
        runtimePath: '/produk/:id',
        groupName: 'produk',
        actionName: 'show',
        actionKind: RouteActionKind.Read,
        crudRole: CrudRole.Show,
        isMutating: false,
        hookKind: RouteHookKind.Query,
        pathParameters: [{ name: 'id', in: 'path', type: 'number', required: true }],
        queryParameters: [],
        security: [],
        middleware: [],
        responses: []
      } as any,
      {
        name: 'produk.store',
        method: 'POST',
        path: '/produk',
        runtimePath: '/produk',
        groupName: 'produk',
        actionName: 'store',
        actionKind: RouteActionKind.Create,
        crudRole: CrudRole.Create,
        isMutating: true,
        hookKind: RouteHookKind.Mutation,
        pathParameters: [],
        queryParameters: [],
        security: [],
        middleware: [],
        responses: []
      } as any,
      {
        name: 'produk.update',
        method: 'PUT',
        path: '/produk/{id}',
        runtimePath: '/produk/:id',
        groupName: 'produk',
        actionName: 'update',
        actionKind: RouteActionKind.Update,
        crudRole: CrudRole.Update,
        isMutating: true,
        hookKind: RouteHookKind.Mutation,
        pathParameters: [{ name: 'id', in: 'path', type: 'number', required: true }],
        queryParameters: [],
        security: [],
        middleware: [],
        responses: []
      } as any,
      {
        name: 'produk.destroy',
        method: 'DELETE',
        path: '/produk/{id}',
        runtimePath: '/produk/:id',
        groupName: 'produk',
        actionName: 'destroy',
        actionKind: RouteActionKind.Delete,
        crudRole: CrudRole.Delete,
        isMutating: true,
        hookKind: RouteHookKind.Mutation,
        pathParameters: [{ name: 'id', in: 'path', type: 'number', required: true }],
        queryParameters: [],
        security: [],
        middleware: [],
        responses: []
      } as any
    ]

    const classified = classifyRoutes(mockRoutes)
    expect(classified).toHaveLength(5)
    expect(classified[0].actionName).toBe('list')
    expect(classified[0].crudRole).toBe(CrudRole.Index)
    expect(classified[1].actionName).toBe('get')
    expect(classified[1].crudRole).toBe(CrudRole.Show)
    expect(classified[2].actionName).toBe('create')
    expect(classified[2].crudRole).toBe(CrudRole.Create)
    expect(classified[3].actionName).toBe('update')
    expect(classified[3].crudRole).toBe(CrudRole.Update)
    expect(classified[4].actionName).toBe('remove')
    expect(classified[4].crudRole).toBe(CrudRole.Delete)
  })
})
