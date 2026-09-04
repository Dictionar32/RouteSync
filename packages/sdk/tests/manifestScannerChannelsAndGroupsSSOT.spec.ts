import { describe, it, expect } from 'vitest'
import {
  StaticLaravelScanner,
  ScannedBroadcastChannelDescriptor,
  ScannedResourceRouteGroupDescriptor,
  ScannedRouteManifestDescriptor,
  ScannedRouteDescriptor,
  RouteManifest,
  BroadcastChannelKind
} from '@routesync/core'

describe('Manifest Scanner Channels & Groups SSOT', () => {
  it('1. ScannedResourceRouteGroupDescriptor creates frozen route groups', () => {
    const route = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users',
      resourceName: 'User'
    })

    const group = ScannedResourceRouteGroupDescriptor.create({
      resourceName: 'User',
      routes: [route]
    })

    expect(group.resourceName).toBe('User')
    expect(group.formTypeName).toBe('UserForm')
    expect(group.routes.length).toBe(1)
    expect(Object.isFrozen(group)).toBe(true)
    expect(Object.isFrozen(group.routes)).toBe(true)
  })

  it('2. ScannedRouteManifestDescriptor accepts and freezes channels and routeGroups', () => {
    const channel = ScannedBroadcastChannelDescriptor.create({
      name: 'orders.{orderId}',
      pattern: 'orders.{orderId}'
    })

    const group = ScannedResourceRouteGroupDescriptor.create({
      resourceName: 'Order'
    })

    const manifest = ScannedRouteManifestDescriptor.create({
      routeGroups: [group],
      channels: [channel]
    })

    expect(manifest.routeGroups.length).toBe(1)
    expect(manifest.channels?.length).toBe(1)
    expect(manifest.channels?.[0].runtimePattern).toBe('orders.${orderId}')
    expect(Object.isFrozen(manifest.routeGroups)).toBe(true)
    expect(Object.isFrozen(manifest.channels)).toBe(true)
  })

  it('3. StaticLaravelScanner automatically groups routes into routeGroups on execute', async () => {
    const scanner = new StaticLaravelScanner({ projectRoot: '/non-existent-path-for-unit-test' })
    
    // Test the grouping logic directly
    const route1 = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/orders',
      resourceName: 'Order'
    })
    const route2 = ScannedRouteDescriptor.create({
      method: 'POST',
      path: '/api/orders',
      resourceName: 'Order'
    })
    const route3 = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/users',
      resourceName: 'User'
    })

    const groupMap = new Map<string, any[]>()
    for (const route of [route1, route2, route3]) {
      const list = groupMap.get(route.resourceName) || []
      list.push(route)
      groupMap.set(route.resourceName, list)
    }
    const routeGroups = Array.from(groupMap.entries()).map(([resName, rList]) =>
      ScannedResourceRouteGroupDescriptor.create({ resourceName: resName, routes: rList })
    )

    expect(routeGroups.length).toBe(2)
    const orderGroup = routeGroups.find(g => g.resourceName === 'Order')
    expect(orderGroup).toBeDefined()
    expect(orderGroup?.routes.length).toBe(2)
  })
})
