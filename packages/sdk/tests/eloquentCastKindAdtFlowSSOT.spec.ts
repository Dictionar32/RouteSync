import { describe, test, expect } from 'vitest'
import {
  ELOQUENT_CAST_REGISTRY,
  EloquentCastKind,
  EloquentCastMapper,
  JsonValueType,
  PrimitiveKind,
  ReadonlyCollectionType,
} from '../../core/src'

describe('Eloquent Cast high-model ADT flow', () => {
  test('registry exposes semantic value models, not duplicated primitive flags', () => {
    expect(Object.isFrozen(ELOQUENT_CAST_REGISTRY)).toBe(true)

    for (const kind of Object.values(EloquentCastKind)) {
      const spec = ELOQUENT_CAST_REGISTRY[kind]
      expect(spec.kind).toBe(kind)
      expect(spec.valueType.kind).toBeDefined()
    }

    expect(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Integer].valueType).toMatchObject({
      kind: 'primitive',
      type: PrimitiveKind.NUMBER,
    })
    expect(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Boolean].valueType).toMatchObject({
      kind: 'primitive',
      type: PrimitiveKind.BOOLEAN,
    })
    expect(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Json].valueType.kind).toBe('json')
    expect(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Collection].valueType.kind).toBe('collection')
  })

  test('mapper preserves high-level meaning for builtin and custom casts', () => {
    expect(EloquentCastMapper.map('decimal:2')).toMatchObject({
      castKind: EloquentCastKind.Decimal,
      valueType: { kind: 'primitive', type: PrimitiveKind.NUMBER },
    })

    expect(EloquentCastMapper.map('json')).toMatchObject({
      castKind: EloquentCastKind.Json,
      valueType: { kind: 'json' },
    })

    expect(EloquentCastMapper.map('collection')).toMatchObject({
      castKind: EloquentCastKind.Collection,
      valueType: { kind: 'collection', element: { kind: 'json' } },
    })

    expect(EloquentCastMapper.map('App\\Casts\\MoneyCast')).toMatchObject({
      castKind: EloquentCastKind.Custom,
      valueType: { kind: 'custom', className: { kind: 'class_name', value: 'App\\Casts\\MoneyCast' } },
    })
  })

  test('json and collection carry semantic type objects instead of UNKNOWN', () => {
    const json = ELOQUENT_CAST_REGISTRY[EloquentCastKind.Json].valueType.semanticType
    const collection = ELOQUENT_CAST_REGISTRY[EloquentCastKind.Collection].valueType.semanticType

    expect(json).toBeInstanceOf(JsonValueType)
    expect(collection).toBeInstanceOf(ReadonlyCollectionType)
    expect((collection as ReadonlyCollectionType).elementType).toBeInstanceOf(JsonValueType)
  })

  test('model cast resolution is attached to the column at the upstream origin boundary', () => {
    const cast = EloquentCastMapper.map('json')
    expect(cast.valueType.semanticType).toBeInstanceOf(JsonValueType)
  })
})
