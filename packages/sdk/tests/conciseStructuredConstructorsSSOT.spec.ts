import { describe, it, expect } from 'vitest'
import {
  ValidationRuleNodeFactory,
  ValidationRuleKind,
  ValidationRuleParser,
  ScannedRouteSecurityDescriptor,
  RouteSecurityClassifier,
  SecuritySchemeKind,
  ScannedPaginatedEnvelopeDescriptor,
  PaginationKind,
  ScannedPolymorphicRelationDescriptor,
  ScannedRouteValidationRuleEntry,
  ScannedRouteSchemaPayload,
  ScannedObjectProperty,
  PrimitiveType,
  PrimitiveKind
} from '@routesync/core'

describe('Concise Reusable Structured Constructors SSOT', () => {
  it('1. ValidationRuleNodeFactory creates strongly typed frozen AST rule nodes', () => {
    const req = ValidationRuleNodeFactory.required()
    expect(req.kind).toBe(ValidationRuleKind.Required)
    expect(Object.isFrozen(req)).toBe(true)

    const min = ValidationRuleNodeFactory.min(10)
    expect(min.kind).toBe(ValidationRuleKind.Min)
    if (min.kind === ValidationRuleKind.Min) {
      expect(min.value).toBe(10)
    }

    const between = ValidationRuleNodeFactory.between(1, 100)
    expect(between.kind).toBe(ValidationRuleKind.Between)
    if (between.kind === ValidationRuleKind.Between) {
      expect(between.min).toBe(1)
      expect(between.max).toBe(100)
    }

    const inRule = ValidationRuleNodeFactory.in(['active', 'pending'])
    expect(inRule.kind).toBe(ValidationRuleKind.In)
    if (inRule.kind === ValidationRuleKind.In) {
      expect(inRule.values).toEqual(['active', 'pending'])
    }
  })

  it('2. ValidationRuleParser uses ValidationRuleNodeFactory under the hood', () => {
    const node = ValidationRuleParser.parse('between:5,20')
    expect(node.kind).toBe(ValidationRuleKind.Between)
    if (node.kind === ValidationRuleKind.Between) {
      expect(node.min).toBe(5)
      expect(node.max).toBe(20)
    }
  })

  it('3. ScannedRouteSecurityDescriptor encapsulates security metadata with smart defaults', () => {
    const pub = ScannedRouteSecurityDescriptor.public()
    expect(pub.isProtected).toBe(false)
    expect(pub.scheme).toBe(SecuritySchemeKind.Public)
    expect(pub.guards).toEqual([])
    expect(pub.abilities).toEqual([])
    expect(Object.isFrozen(pub)).toBe(true)

    const sec = RouteSecurityClassifier.classify(['auth:sanctum', 'ability:manage-users'])
    expect(sec.isProtected).toBe(true)
    expect(sec.scheme).toBe(SecuritySchemeKind.Sanctum)
    expect(sec.guards).toEqual(['sanctum'])
    expect(sec.abilities).toEqual(['manage-users'])
    expect(Object.isFrozen(sec)).toBe(true)
  })

  it('4. ScannedPaginatedEnvelopeDescriptor provides concise static helpers', () => {
    const lenAware = ScannedPaginatedEnvelopeDescriptor.lengthAware()
    expect(lenAware.kind).toBe(PaginationKind.LengthAware)
    expect(lenAware.dataKey).toBe('data')
    expect(lenAware.metaKey).toBe('meta')
    expect(lenAware.linksKey).toBe('links')
    expect(lenAware.envelopeTypeName).toBe('PaginatedResponse<T>')
    expect(Object.isFrozen(lenAware)).toBe(true)

    const cursor = ScannedPaginatedEnvelopeDescriptor.cursor('items')
    expect(cursor.kind).toBe(PaginationKind.Cursor)
    expect(cursor.dataKey).toBe('items')
    expect(cursor.linksKey).toBeNull()
    expect(cursor.envelopeTypeName).toBe('CursorPaginatedResponse<T>')
  })

  it('5. ScannedPolymorphicRelationDescriptor sets standard defaults', () => {
    const poly = ScannedPolymorphicRelationDescriptor.create({
      morphType: 'morphTo',
      targetModels: ['Post', 'Comment']
    })

    expect(poly.morphType).toBe('morphTo')
    expect(poly.idColumn).toBe('commentable_id')
    expect(poly.typeColumn).toBe('commentable_type')
    expect(poly.targetModels).toEqual(['Post', 'Comment'])
    expect(poly.unionTypeName).toBe('CommentableTarget')
    expect(Object.isFrozen(poly)).toBe(true)
  })

  it('6. ScannedRouteValidationRuleEntry auto-derives propertyName and parses ast', () => {
    const entry = ScannedRouteValidationRuleEntry.create(
      'shipping_address',
      ['required', 'string', 'min:5']
    )

    expect(entry.fieldName).toBe('shipping_address')
    expect(entry.propertyName).toBe('shippingAddress') // ✅ Auto-camelCased
    expect(entry.rules).toEqual(['required', 'string', 'min:5'])
    expect(entry.ast).toBeDefined()
    expect(entry.ast?.length).toBe(3)
    expect(entry.ast?.[0].kind).toBe(ValidationRuleKind.Required)
    expect(entry.ast?.[1].kind).toBe(ValidationRuleKind.String)
    expect(entry.ast?.[2].kind).toBe(ValidationRuleKind.Min)
    expect(Object.isFrozen(entry)).toBe(true)
  })

  it('7. ScannedRouteSchemaPayload encapsulates validation entries', () => {
    const entry = ScannedRouteValidationRuleEntry.create(
      'email',
      ['required', 'email']
    )
    const payload = ScannedRouteSchemaPayload.fromRules([entry])

    expect(payload.rules?.length).toBe(1)
    expect(payload.rules?.[0].propertyName).toBe('email')
    expect(Object.isFrozen(payload)).toBe(true)
  })

  it('8. ScannedObjectProperty guarantees default required = !nullable and freezes', () => {
    const prop = ScannedObjectProperty.create({
      name: 'userId',
      type: new PrimitiveType(PrimitiveKind.NUMBER),
      nullable: false
    })

    expect(prop.name).toBe('userId')
    expect(prop.nullable).toBe(false)
    expect(prop.required).toBe(true)
    expect(Object.isFrozen(prop)).toBe(true)

    const nullableProp = ScannedObjectProperty.create({
      name: 'notes',
      type: new PrimitiveType(PrimitiveKind.STRING),
      nullable: true
    })
    expect(nullableProp.nullable).toBe(true)
    expect(nullableProp.required).toBe(false)
  })
})
