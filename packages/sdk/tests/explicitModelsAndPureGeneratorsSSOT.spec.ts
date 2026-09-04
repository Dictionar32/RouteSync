import { describe, it, expect } from 'vitest'
import {
  ScannedBroadcastChannelDescriptor,
  BroadcastChannelKind,
  ScannedRouteParameterDescriptor,
  RouteParameterType,
  DatabaseColumnKind,
  ScannedModelColumnDescriptor,
  ScannedModelDescriptor,
  RouteManifest,
  ScannedRouteDescriptor,
  ResourceResponseDescriptor,
  ResponseShape
} from '@routesync/core'
import { ModelGenerator } from '@routesync/cli/src/generators/ModelGenerator'
import { ResponseAnalysisHelper } from '@routesync/cli/src/generators/response-analysis-helper'

describe('Explicit Models & Pure Generators SSOT', () => {
  it('1. ScannedBroadcastChannelDescriptor computes runtimePattern at Origin Boundary', () => {
    const channel = ScannedBroadcastChannelDescriptor.create({
      name: 'orders.{orderId}',
      pattern: 'orders.{orderId}',
      parameters: [
        ScannedRouteParameterDescriptor.create({ name: 'orderId', propertyName: 'orderId', type: RouteParameterType.Number })
      ]
    })

    expect(channel.runtimePattern).toBe('orders.${orderId}')
    expect(channel.kind).toBe(BroadcastChannelKind.Private)
    expect(channel.isPrivate).toBe(true)
    expect(Object.isFrozen(channel)).toBe(true)
  })

  it('2. ModelGenerator purely consumes guaranteed col.columnKind without downstream guessing', () => {
    const colInt = ScannedModelColumnDescriptor.create({
      name: 'total_amount',
      type: 'int'
    })
    const colBool = ScannedModelColumnDescriptor.create({
      name: 'is_active',
      type: 'tinyint(1)'
    })
    const colJson = ScannedModelColumnDescriptor.create({
      name: 'payload',
      type: 'json'
    })

    expect(colInt.columnKind).toBe(DatabaseColumnKind.Integer)
    expect(colBool.columnKind).toBe(DatabaseColumnKind.Boolean)
    expect(colJson.columnKind).toBe(DatabaseColumnKind.Json)

    // Verify mapColumnKindToTs mapping behavior
    expect((ModelGenerator as any).mapColumnKindToTs(colInt.columnKind)).toBe('number')
    expect((ModelGenerator as any).mapColumnKindToTs(colBool.columnKind)).toBe('boolean')
    expect((ModelGenerator as any).mapColumnKindToTs(colJson.columnKind)).toBe('Record<string, unknown>')
  })

  it('3. ResponseAnalysisHelper purely consumes route.response.shape from manifest', () => {
    const route = ScannedRouteDescriptor.create({
      name: 'orders.index',
      method: 'GET',
      path: '/api/orders',
      resourceName: 'Order',
      response: ResourceResponseDescriptor.create({
        resourceName: 'Order',
        shape: ResponseShape.Paginated
      })
    })

    const manifest: RouteManifest = {
      version: '1.0',
      baseURL: 'http://localhost',
      routes: [route],
      models: [],
      resources: [],
      routeGroups: [],
      requestTypes: [],
      semanticTypes: [],
      generatedAt: new Date().toISOString()
    }

    const artifactMap = ResponseAnalysisHelper.buildResponseArtifactMap(manifest)
    const artifact = artifactMap.get('orders.index.Response')

    expect(artifact).toBeDefined()
    expect(artifact?.isCollection()).toBe(true)
    expect(artifact?.responseBody.shape).toBe('paginated')
  })
})
