import { describe, it, expect } from 'vitest'
import {
  ScannedModelCastDescriptor,
  ScannedModelRelationDescriptor,
  ScannedHttpErrorResponseDescriptor,
  ScannedRouteQueryParameterDescriptor,
  ScannedRoutePolicyDescriptor,
  ScannedRateLimitDescriptor,
  ScannedBroadcastChannelDescriptor,
  ScannedScalarFieldNode,
  ScannedArrayFieldNode,
  ScannedObjectFieldNode,
  ValidationTreeBuilder,
  ValidationRuleKind,
  EloquentCastKind,
  EloquentRelationType,
  HttpStatusCode,
  BroadcastChannelKind,
  RouteParameterType,
  PrimitiveKind
} from '@routesync/core'

describe('Reusable Structured Constructors SSOT', () => {
  it('1. ScannedModelCastDescriptor should auto-resolve castKind and semanticType', () => {
    const cast = ScannedModelCastDescriptor.create({
      column: 'amount_cents',
      targetType: 'integer'
    })

    expect(cast.column).toBe('amount_cents')
    expect(cast.targetType).toBe('integer')
    expect(cast.castKind).toBe(EloquentCastKind.Integer)
    expect(cast.semanticType).toBe(PrimitiveKind.NUMBER)
    expect(Object.isFrozen(cast)).toBe(true)
  })

  it('2. ScannedModelRelationDescriptor should auto-resolve cardinality and isCollection', () => {
    const relation = ScannedModelRelationDescriptor.create({
      name: 'orderItems',
      type: EloquentRelationType.HasMany,
      modelName: 'OrderItem'
    })

    expect(relation.name).toBe('orderItems')
    expect(relation.type).toBe('hasMany')
    expect(relation.modelName).toBe('OrderItem')
    expect(relation.targetModel).toBe('OrderItem')
    expect(relation.cardinality).toBe('many')
    expect(relation.isCollection).toBe(true)
    expect(Object.isFrozen(relation)).toBe(true)
  })

  it('3. ScannedHttpErrorResponseDescriptor should provide standard 422 and 401 factories', () => {
    const error422 = ScannedHttpErrorResponseDescriptor.unprocessableEntity()
    expect(error422.statusCode).toBe(HttpStatusCode.UnprocessableEntity)
    expect(error422.name).toBe('UnprocessableEntity')
    expect(error422.typeName).toBe('LaravelValidationError')
    expect(error422.schema.properties).toBeDefined()
    expect(Object.isFrozen(error422)).toBe(true)

    const error401 = ScannedHttpErrorResponseDescriptor.unauthorized()
    expect(error401.statusCode).toBe(HttpStatusCode.Unauthorized)
    expect(error401.name).toBe('Unauthorized')
    expect(error401.typeName).toBe('LaravelUnauthorizedError')
    expect(Object.isFrozen(error401)).toBe(true)
  })

  it('4. ScannedRouteQueryParameterDescriptor should guarantee propertyName and defaults', () => {
    const queryParam = ScannedRouteQueryParameterDescriptor.create({
      name: 'filter_status'
    })

    expect(queryParam.name).toBe('filter_status')
    expect(queryParam.propertyName).toBe('filterStatus')
    expect(queryParam.required).toBe(false)
    expect(queryParam.type).toBe(RouteParameterType.String)
    expect(Object.isFrozen(queryParam)).toBe(true)
  })

  it('5. ScannedRoutePolicyDescriptor and ScannedRateLimitDescriptor should freeze and encapsulate options', () => {
    const policy = ScannedRoutePolicyDescriptor.create({
      ability: 'update',
      modelParameter: 'order'
    })
    expect(policy.ability).toBe('update')
    expect(policy.modelParameter).toBe('order')
    expect(Object.isFrozen(policy)).toBe(true)

    const rateLimit = ScannedRateLimitDescriptor.create({
      maxAttempts: 100
    })
    expect(rateLimit.maxAttempts).toBe(100)
    expect(rateLimit.decayMinutes).toBe(1)
    expect(Object.isFrozen(rateLimit)).toBe(true)
  })

  it('6. ScannedBroadcastChannelDescriptor should encapsulate channel properties', () => {
    const channel = ScannedBroadcastChannelDescriptor.create({
      name: 'chat.room.{id}',
      isPresence: true
    })

    expect(channel.name).toBe('chat.room.{id}')
    expect(channel.pattern).toBe('chat.room.{id}')
    expect(channel.kind).toBe(BroadcastChannelKind.Presence)
    expect(channel.isPresence).toBe(true)
    expect(Object.isFrozen(channel)).toBe(true)
  })

  it('7. ValidationTreeBuilder should construct structured field nodes', () => {
    const tree = ValidationTreeBuilder.buildTree([
      {
        fieldName: 'items.*.name',
        rules: ['required', 'string'],
        ast: [{ kind: ValidationRuleKind.Required }, { kind: ValidationRuleKind.String }]
      },
      {
        fieldName: 'items.*.quantity',
        rules: ['required', 'integer'],
        ast: [{ kind: ValidationRuleKind.Required }, { kind: ValidationRuleKind.Number }]
      }
    ])

    expect(tree.length).toBe(1)
    const arrayNode = tree[0]
    expect(arrayNode.kind).toBe('array')
    expect(arrayNode.propertyName).toBe('items')
    expect(arrayNode.element.kind).toBe('object')
    if (arrayNode.element.kind === 'object') {
      expect(arrayNode.element.fields.length).toBe(2)
      expect(arrayNode.element.fields[0].propertyName).toBe('name')
      expect(arrayNode.element.fields[1].propertyName).toBe('quantity')
    }
  })
})
