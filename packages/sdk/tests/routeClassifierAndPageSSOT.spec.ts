import { describe, it, expect } from 'vitest'
import {
  ScannedRouteDescriptor,
  ScannedRouteParameterDescriptor,
  RouteParameterType
} from '@routesync/core'
import {
  classifyRoutes,
  ScannedClassifiedRouteDescriptor
} from '@routesync/cli/src/generators/route-classifier'
import {
  ScannedPageEndpointDescriptor
} from '@routesync/cli/src/generators/RoutesGenerator'

describe('Route Classifier & Page Endpoint SSOT', () => {
  it('1. ScannedClassifiedRouteDescriptor creates frozen instances', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/orders',
      resourceName: 'Order'
    })

    const classified = new ScannedClassifiedRouteDescriptor({
      raw: route,
      groupName: 'orders',
      actionName: 'list',
      runtimePath: '/api/orders',
      method: 'GET',
      hasParams: false,
      hasTrailingParam: false,
      crudRole: 'index'
    })

    expect(classified.groupName).toBe('orders')
    expect(classified.actionName).toBe('list')
    expect(classified.runtimePath).toBe('/api/orders')
    expect(classified.crudRole).toBe('index')
    expect(Object.isFrozen(classified)).toBe(true)
  })

  it('2. classifyRoutes directly consumes route.groupName, route.crudRole, and route.runtimePath', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/v1/orders/{id}',
      resourceName: 'Order',
      groupName: 'orders',
      crudRole: 'show',
      runtimePath: '/api/v1/orders/:id',
      pathParameters: [
        ScannedRouteParameterDescriptor.create({ name: 'id', type: RouteParameterType.Number })
      ]
    })

    const classifiedList = classifyRoutes([route])
    expect(classifiedList.length).toBe(1)
    const classified = classifiedList[0]

    expect(classified instanceof ScannedClassifiedRouteDescriptor).toBe(true)
    expect(classified.groupName).toBe('orders')
    expect(classified.crudRole).toBe('show')
    expect(classified.runtimePath).toBe('/api/v1/orders/:id')
    expect(classified.hasParams).toBe(true)
    expect(classified.hasTrailingParam).toBe(true)
    expect(classified.actionName).toBe('get')
  })

  it('3. ScannedPageEndpointDescriptor encapsulates leaf page endpoints with frozen arrays', () => {
    const endpoint = new ScannedPageEndpointDescriptor({
      path: '/dashboard/analytics',
      query: ['period', 'filter'],
      params: ['orgId']
    })

    expect(endpoint.path).toBe('/dashboard/analytics')
    expect(endpoint.query).toEqual(['period', 'filter'])
    expect(endpoint.params).toEqual(['orgId'])
    expect(Object.isFrozen(endpoint)).toBe(true)
    expect(Object.isFrozen(endpoint.query)).toBe(true)
    expect(Object.isFrozen(endpoint.params)).toBe(true)
  })
})
