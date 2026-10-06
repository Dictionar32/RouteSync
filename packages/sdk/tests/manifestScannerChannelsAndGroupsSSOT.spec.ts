import { RouteSemanticFlowFactory } from '../../core/src/compiler/scanner/descriptors/route/RouteSemanticFlowFactory'
import { describe, it, expect } from 'vitest'
import {
  ScannedBroadcastChannelDescriptor,
  ScannedResourceRouteGroupDescriptor,
  ScannedRouteManifestDescriptor,
  RouteManifest,
  BroadcastChannelKind
} from '@routesync/core'

describe('Manifest Channels & Groups SSOT', () => {
  it('1. ScannedResourceRouteGroupDescriptor creates frozen route groups', () => {
    const route = RouteSemanticFlowFactory.create({
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


})
