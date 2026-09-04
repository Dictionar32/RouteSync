import { describe, it, expect } from 'vitest'
import {
  ScannedRouteDescriptor,
  ResourceResponseDescriptor,
  ResponseShape,
  BroadcastChannelKind,
  BroadcastChannelDescriptor,
  RoutePolicyDescriptor,
  RouteParameterType,
  RouteParameterLocation
} from '@routesync/core'
import { NextActionGenerator } from '../../cli/src/generators/NextActionGenerator'
import { QueryKeyGenerator } from '../../cli/src/generators/QueryKeyGenerator'
import { LaravelChannelParser } from '../../cli/src/parsers/LaravelChannelParser'

describe('Audited Explicit Model Data Flow SSOT', () => {
  it('1. ScannedRouteDescriptor should guarantee groupName, crudRole, and runtimePath at Origin Boundary', () => {
    const showRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users/{user_id}',
      resourceName: 'UserResource',
      actionName: 'show',
      actionKind: 'read',
      isMutating: false
    })

    expect(showRoute.groupName).toBe('userResource')
    expect(showRoute.crudRole).toBe('show')
    expect(showRoute.runtimePath).toBe('/api/users/:user_id')

    const indexRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users',
      resourceName: 'UserResource',
      actionName: 'index',
      actionKind: 'read',
      isMutating: false
    })

    expect(indexRoute.crudRole).toBe('index')
    expect(indexRoute.runtimePath).toBe('/api/users')

    const createRoute = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/users',
      resourceName: 'UserResource',
      actionName: 'store',
      actionKind: 'create',
      isMutating: true
    })

    expect(createRoute.crudRole).toBe('create')

    const deleteRoute = ScannedRouteDescriptor.create({
      method: 'DELETE',
      path: '/api/users/{id}',
      resourceName: 'UserResource',
      actionName: 'destroy',
      actionKind: 'delete',
      isMutating: true
    })

    expect(deleteRoute.crudRole).toBe('delete')
  })

  it('2. ScannedRouteDescriptor should extract Laravel policies from can: middleware', () => {
    const protectedRoute = ScannedRouteDescriptor.create({
      method: 'PUT',
      path: '/api/orders/{id}',
      resourceName: 'OrderResource',
      actionName: 'update',
      actionKind: 'update',
      isMutating: true,
      middleware: ['auth:sanctum', 'can:update,order', 'verified']
    })

    expect(protectedRoute.policies.length).toBe(1)
    expect(protectedRoute.policies[0].ability).toBe('update')
    expect(protectedRoute.policies[0].modelParameter).toBe('order')
  })

  it('3. BroadcastChannelDescriptor and LaravelChannelParser should extract patterns, parameters, and kind', async () => {
    const channel: BroadcastChannelDescriptor = {
      name: 'orders.{orderId}',
      kind: BroadcastChannelKind.Private,
      pattern: 'orders.{orderId}',
      parameters: [
        {
          name: 'orderId',
          propertyName: 'orderId',
          in: RouteParameterLocation.Path,
          required: true,
          type: RouteParameterType.Number
        }
      ]
    }

    expect(channel.kind).toBe('private')
    expect(channel.parameters[0].propertyName).toBe('orderId')
  })

  it('4. QueryKeyGenerator should emit generic createBaseQueryKey with typed ID parameter', async () => {
    const manifest: any = {
      baseURL: 'http://localhost/api',
      models: [
        {
          name: 'Order',
          shortName: 'Order',
          primaryKey: 'id',
          keyType: 'int',
          keySemanticType: 'number',
          incrementing: true
        }
      ],
      routes: [
        {
          method: 'GET',
          path: '/orders',
          name: 'orders.index',
          groupName: 'orders',
          crudRole: 'index',
          actionName: 'index'
        },
        {
          method: 'GET',
          path: '/orders/{id}',
          name: 'orders.show',
          groupName: 'orders',
          crudRole: 'show',
          actionName: 'show'
        }
      ]
    }

    let writtenContent = ''
    const originalWriteFile = (await import('fs-extra')).default.writeFile
    ;(await import('fs-extra')).default.writeFile = (async (_path: any, data: any) => {
      writtenContent = data.toString()
    }) as any

    try {
      await QueryKeyGenerator.generate(manifest, '/tmp')
      expect(writtenContent).toContain('createBaseQueryKey')
      expect(writtenContent).toContain('TId = string | number')
      expect(writtenContent).toContain('createBaseQueryKey<typeof Entity.ORDERS, number>(Entity.ORDERS)')
    } finally {
      ;(await import('fs-extra')).default.writeFile = originalWriteFile
    }
  })
})
