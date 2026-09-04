import { describe, it, expect } from 'vitest'
import {
  ScannedControllerActionDescriptor,
  ScannedRouteParameterDescriptor,
  ScannedBroadcastChannelDescriptor,
  BroadcastChannelKind,
  RouteParameterType,
  ResourceResponseDescriptor,
  StaticLaravelScanner,
  ScannedRouteDescriptor,
  ScannedRouteValidationRuleEntry,
  ScannedRouteSchemaPayload
} from '@routesync/core'

describe('Ternary Elimination & ScannedControllerAction SSOT', () => {
  it('1. ScannedControllerActionDescriptor should encapsulate action metadata cleanly and freeze', () => {
    const action = ScannedControllerActionDescriptor.create({
      sourceFile: '/app/Http/Controllers/OrderController.php',
      sourceLine: 45,
      response: ResourceResponseDescriptor.single('OrderResource'),
      formRequestName: 'CreateOrderRequest',
      schemaRules: [
        ScannedRouteValidationRuleEntry.create('total', ['required', 'numeric'])
      ]
    })

    expect(action.sourceFile).toBe('/app/Http/Controllers/OrderController.php')
    expect(action.sourceLine).toBe(45)
    expect(action.formRequestName).toBe('CreateOrderRequest')
    expect(action.schemaRules?.length).toBe(1)
    expect(action.schemaRules?.[0].propertyName).toBe('total')
    expect(Object.isFrozen(action)).toBe(true)
  })

  it('2. ScannedRouteParameterDescriptor should determine numeric vs string without external ternary duplication', () => {
    const idParam = ScannedRouteParameterDescriptor.create({ name: 'id' })
    expect(idParam.type).toBe(RouteParameterType.Number)
    expect(idParam.propertyName).toBe('id')

    const fkParam = ScannedRouteParameterDescriptor.create({ name: 'author_id' })
    expect(fkParam.type).toBe(RouteParameterType.Number)
    expect(fkParam.propertyName).toBe('authorId')

    const slugParam = ScannedRouteParameterDescriptor.create({ name: 'post', bindingField: 'slug' })
    expect(slugParam.type).toBe(RouteParameterType.String)
    expect(slugParam.propertyName).toBe('post')

    const boundIdParam = ScannedRouteParameterDescriptor.create({ name: 'order', bindingField: 'id' })
    expect(boundIdParam.type).toBe(RouteParameterType.Number)
  })

  it('3. ScannedBroadcastChannelDescriptor resolves presence, private, and public channels without nested ternaries', () => {
    const presenceChannel = ScannedBroadcastChannelDescriptor.create({
      name: 'chat.room.{id}'
    })
    expect(presenceChannel.kind).toBe(BroadcastChannelKind.Presence)

    const privateChannel = ScannedBroadcastChannelDescriptor.create({
      name: 'orders.{id}'
    })
    expect(privateChannel.kind).toBe(BroadcastChannelKind.Private)

    const publicChannel = ScannedBroadcastChannelDescriptor.create({
      name: 'public.announcements'
    })
    expect(publicChannel.kind).toBe(BroadcastChannelKind.Public)
  })

  it('4. StaticLaravelScanner.deriveRequestTypes should cleanly derive request types without chained ternaries', () => {
    const routes = [
      ScannedRouteDescriptor.create({
        method: 'POST',
        path: '/api/orders',
        resourceName: 'Order',
        actionName: 'store',
        actionKind: 'create',
        isMutating: true,
        schema: ScannedRouteSchemaPayload.fromRules([
          ScannedRouteValidationRuleEntry.create('total', ['required', 'numeric']),
          ScannedRouteValidationRuleEntry.create('items.*.name', ['required', 'string'])
        ])
      })
    ]

    const derived = StaticLaravelScanner.deriveRequestTypes(routes as any)
    expect(derived.length).toBe(1)
    const orderReq = derived[0]
    expect(orderReq.resourceName).toBe('order')
    expect(orderReq.actions.length).toBe(1)
    expect(orderReq.actions[0].name).toBe('create')
    expect(orderReq.actions[0].fields.length).toBe(2)
  })
})
