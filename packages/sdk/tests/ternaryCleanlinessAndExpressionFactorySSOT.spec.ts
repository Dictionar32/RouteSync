import { describe, it, expect } from 'vitest'
import {
  ResourceFieldExpressionFactory,
  ResourceExpressionKind,
  ScannedModelAccessorDescriptor,
  PrimitiveKind
} from '@routesync/core'
import { classifyRoutes } from '@routesync/cli/src/generators/route-classifier'
import { ScannedRouteDescriptor } from '@routesync/core'

describe('Ternary Cleanliness & Expression Factory SSOT', () => {
  it('1. ResourceFieldExpressionFactory generates structured and frozen AST nodes', () => {
    const prim = ResourceFieldExpressionFactory.primitive('int')
    expect(prim.kind).toBe(ResourceExpressionKind.Primitive)
    expect((prim as any).type).toBe('int')
    expect(Object.isFrozen(prim)).toBe(true)

    const modelNode = ResourceFieldExpressionFactory.model('Product', true)
    expect(modelNode.kind).toBe(ResourceExpressionKind.Model)
    expect((modelNode as any).model).toBe('Product')
    expect((modelNode as any).collection).toBe(true)
    expect(Object.isFrozen(modelNode)).toBe(true)

    const resNode = ResourceFieldExpressionFactory.resource('ProductResource')
    expect(resNode.kind).toBe(ResourceExpressionKind.Resource)
    expect((resNode as any).resource).toBe('ProductResource')
    expect(Object.isFrozen(resNode)).toBe(true)
  })

  it('2. ScannedModelAccessorDescriptor correctly classifies semanticType via structured branching', () => {
    const numAccessor = ScannedModelAccessorDescriptor.create({
      name: 'formatted_total',
      type: 'number'
    })
    expect(numAccessor.semanticType).toBe(PrimitiveKind.NUMBER)

    const boolAccessor = ScannedModelAccessorDescriptor.create({
      name: 'has_discount',
      type: 'boolean'
    })
    expect(boolAccessor.semanticType).toBe(PrimitiveKind.BOOLEAN)

    const strAccessor = ScannedModelAccessorDescriptor.create({
      name: 'full_address',
      type: 'string'
    })
    expect(strAccessor.semanticType).toBe(PrimitiveKind.STRING)
  })

  it('3. classifyRoutes accurately assigns CrudRole without nested ternaries', () => {
    const indexRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/posts',
      resourceName: 'Post'
    })
    const showRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/posts/{id}',
      resourceName: 'Post'
    })
    const customRoute = ScannedRouteDescriptor.create({
      method: 'GET',
      path: '/api/posts/popular/{category}',
      resourceName: 'Post'
    })

    const classified = classifyRoutes([indexRoute, showRoute, customRoute])
    expect(classified[0].crudRole).toBe('index')
    expect(classified[1].crudRole).toBe('show')
    expect(classified[2].crudRole).toBe('custom')
  })
})
