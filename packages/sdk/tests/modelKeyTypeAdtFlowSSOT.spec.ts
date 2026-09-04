import { describe, test, expect } from 'vitest'
import {
  ModelKeyType,
  MODEL_KEY_TYPE_REGISTRY,
  matchModelKeyType,
  ModelKeyTypeVisitor,
  ModelKeyTypeMapper,
  PrimitiveKind
} from '../../core/src'

describe('ModelKeyType ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchModelKeyType executes pure catamorphism for numeric key types (int, bigint)', () => {
    const visitor: ModelKeyTypeVisitor<string> = {
      int: (spec) => `NUMERIC:${spec.tsType}:${spec.sampleValue}`,
      bigint: (spec) => `NUMERIC:${spec.tsType}:${spec.sampleValue}`,
      string: (spec) => `STRING:${spec.tsType}:${spec.sampleValue}`,
      uuid: (spec) => `STRING:${spec.tsType}:${spec.sampleValue}`,
      ulid: (spec) => `STRING:${spec.tsType}:${spec.sampleValue}`
    }

    expect(matchModelKeyType(ModelKeyType.Int, visitor)).toBe('NUMERIC:number:1')
    expect(matchModelKeyType(ModelKeyType.BigInt, visitor)).toBe('NUMERIC:number:1')
  })

  test('2. matchModelKeyType executes pure catamorphism for string-like key types (string, uuid, ulid)', () => {
    const visitor: ModelKeyTypeVisitor<string> = {
      int: () => 'int',
      bigint: () => 'bigint',
      string: (spec) => `STR:${spec.type}`,
      uuid: (spec) => `UUID:${spec.type}`,
      ulid: (spec) => `ULID:${spec.type}`
    }

    expect(matchModelKeyType(ModelKeyType.String, visitor)).toBe('STR:string')
    expect(matchModelKeyType(ModelKeyType.Uuid, visitor)).toBe('UUID:uuid')
    expect(matchModelKeyType(ModelKeyType.Ulid, visitor)).toBe('ULID:ulid')
  })

  test('3. matchModelKeyType accepts model objects with keyType property', () => {
    const model = { keyType: ModelKeyType.Uuid, name: 'User' }

    const result = matchModelKeyType(model, {
      int: () => 'INT_MODEL',
      bigint: () => 'BIGINT_MODEL',
      string: () => 'STRING_MODEL',
      uuid: () => 'UUID_MODEL',
      ulid: () => 'ULID_MODEL'
    })

    expect(result).toBe('UUID_MODEL')
  })

  test('4. MODEL_KEY_TYPE_REGISTRY provides frozen O(1) specifications for all 5 key types', () => {
    expect(Object.isFrozen(MODEL_KEY_TYPE_REGISTRY)).toBe(true)

    const allTypes: readonly ModelKeyType[] = Object.values(ModelKeyType)
    expect(allTypes.length).toBe(5)

    for (const type of allTypes) {
      const spec = MODEL_KEY_TYPE_REGISTRY[type]
      expect(spec).toBeDefined()
      expect(spec.type).toBe(type)
      expect(['number', 'string']).toContain(spec.tsType)
      expect(typeof spec.isNumeric).toBe('boolean')
      expect(typeof spec.isStringLike).toBe('boolean')
      expect(spec.primitiveKind).toBeDefined()
      expect(spec.sampleValue).toBeDefined()
      expect(typeof spec.description).toBe('string')
    }

    // Numeric checks
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Int].isNumeric).toBe(true)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Int].primitiveKind).toBe(PrimitiveKind.NUMBER)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.BigInt].isNumeric).toBe(true)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.BigInt].primitiveKind).toBe(PrimitiveKind.NUMBER)

    // String-like checks
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.String].isStringLike).toBe(true)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.String].primitiveKind).toBe(PrimitiveKind.STRING)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Uuid].isStringLike).toBe(true)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Uuid].primitiveKind).toBe(PrimitiveKind.STRING)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Ulid].isStringLike).toBe(true)
    expect(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Ulid].primitiveKind).toBe(PrimitiveKind.STRING)
  })

  test('5. ModelKeyTypeMapper.normalize normalizes strings in O(1) without if/else branching', () => {
    expect(ModelKeyTypeMapper.normalize('int')).toBe(ModelKeyType.Int)
    expect(ModelKeyTypeMapper.normalize('integer')).toBe(ModelKeyType.Int)
    expect(ModelKeyTypeMapper.normalize('INTEGER')).toBe(ModelKeyType.Int)
    expect(ModelKeyTypeMapper.normalize('bigint')).toBe(ModelKeyType.BigInt)
    expect(ModelKeyTypeMapper.normalize('string')).toBe(ModelKeyType.String)
    expect(ModelKeyTypeMapper.normalize('uuid')).toBe(ModelKeyType.Uuid)
    expect(ModelKeyTypeMapper.normalize('UUID')).toBe(ModelKeyType.Uuid)
    expect(ModelKeyTypeMapper.normalize('ulid')).toBe(ModelKeyType.Ulid)
    expect(ModelKeyTypeMapper.normalize('ULID')).toBe(ModelKeyType.Ulid)
    expect(ModelKeyTypeMapper.normalize(null)).toBe(ModelKeyType.Int)
    expect(ModelKeyTypeMapper.normalize(undefined)).toBe(ModelKeyType.Int)
    expect(ModelKeyTypeMapper.normalize('unknown_type')).toBe(ModelKeyType.Int)
  })

  test('6. Zero-if pipeline deriving TypeScript primary key signatures from models', () => {
    const models = [
      { name: 'User', primaryKey: 'id', keyType: ModelKeyType.Int },
      { name: 'Order', primaryKey: 'uuid', keyType: ModelKeyType.Uuid },
      { name: 'Invoice', primaryKey: 'ulid', keyType: ModelKeyType.Ulid }
    ]

    const signatures = models.map(m => {
      const spec = MODEL_KEY_TYPE_REGISTRY[m.keyType]
      return `${m.name}.${m.primaryKey}: ${spec.tsType}`
    })

    expect(signatures).toEqual([
      'User.id: number',
      'Order.uuid: string',
      'Invoice.ulid: string'
    ])
  })
})
