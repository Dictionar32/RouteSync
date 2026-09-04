import { describe, test, expect } from 'vitest'
import {
  matchEloquentCastKind,
  ELOQUENT_CAST_REGISTRY,
  EloquentCastKind,
  EloquentCastMapper,
  PrimitiveKind
} from '../../core/src'

describe('EloquentCastKind ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchEloquentCastKind executes pure catamorphism for Numeric cast kinds', () => {
    const intResult = matchEloquentCastKind(EloquentCastKind.Integer, {
      integer: (spec) => `INT:${spec.tsType}:${spec.isNumeric}:${spec.semanticType}`,
      float: () => 'FLOAT',
      decimal: () => 'DECIMAL',
      boolean: () => 'BOOL',
      string: () => 'STR',
      datetime: () => 'DATETIME',
      date: () => 'DATE',
      timestamp: () => 'TIMESTAMP',
      array: () => 'ARRAY',
      json: () => 'JSON',
      object: () => 'OBJECT',
      collection: () => 'COLLECTION',
      encrypted: () => 'ENCRYPTED',
      custom: () => 'CUSTOM'
    })

    expect(intResult).toBe('INT:number:true:number')

    const floatResult = matchEloquentCastKind(EloquentCastKind.Float, {
      integer: () => 'INT',
      float: (spec) => `FLOAT:${spec.tsType}:${spec.isNumeric}:${spec.semanticType}`,
      decimal: () => 'DECIMAL',
      boolean: () => 'BOOL',
      string: () => 'STR',
      datetime: () => 'DATETIME',
      date: () => 'DATE',
      timestamp: () => 'TIMESTAMP',
      array: () => 'ARRAY',
      json: () => 'JSON',
      object: () => 'OBJECT',
      collection: () => 'COLLECTION',
      encrypted: () => 'ENCRYPTED',
      custom: () => 'CUSTOM'
    })

    expect(floatResult).toBe('FLOAT:number:true:number')

    const decimalResult = matchEloquentCastKind(EloquentCastKind.Decimal, {
      integer: () => 'INT',
      float: () => 'FLOAT',
      decimal: (spec) => `DECIMAL:${spec.tsType}:${spec.isNumeric}:${spec.semanticType}`,
      boolean: () => 'BOOL',
      string: () => 'STR',
      datetime: () => 'DATETIME',
      date: () => 'DATE',
      timestamp: () => 'TIMESTAMP',
      array: () => 'ARRAY',
      json: () => 'JSON',
      object: () => 'OBJECT',
      collection: () => 'COLLECTION',
      encrypted: () => 'ENCRYPTED',
      custom: () => 'CUSTOM'
    })

    expect(decimalResult).toBe('DECIMAL:number:true:number')
  })

  test('2. matchEloquentCastKind executes pure catamorphism for Boolean, String, and Encrypted kinds', () => {
    const boolResult = matchEloquentCastKind(EloquentCastKind.Boolean, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: (spec) => `BOOL:${spec.tsType}:${spec.semanticType}`,
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(boolResult).toBe('BOOL:boolean:boolean')

    const stringResult = matchEloquentCastKind(EloquentCastKind.String, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: (spec) => `STR:${spec.tsType}:${spec.semanticType}`,
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(stringResult).toBe('STR:string:string')

    const encryptedResult = matchEloquentCastKind(EloquentCastKind.Encrypted, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: (spec) => `ENCRYPTED:${spec.tsType}:${spec.semanticType}`,
      custom: () => 'N'
    })

    expect(encryptedResult).toBe('ENCRYPTED:string:string')
  })

  test('3. matchEloquentCastKind executes pure catamorphism for DateTime, Date, and Timestamp kinds', () => {
    const dateResult = matchEloquentCastKind(EloquentCastKind.Date, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: (spec) => `DATE:${spec.tsType}:${spec.semanticType}:${spec.isDateTime}`,
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(dateResult).toBe('DATE:string:datetime:true')

    const dtResult = matchEloquentCastKind(EloquentCastKind.DateTime, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: (spec) => `DATETIME:${spec.tsType}:${spec.semanticType}:${spec.isDateTime}`,
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(dtResult).toBe('DATETIME:string:datetime:true')

    const tsResult = matchEloquentCastKind(EloquentCastKind.Timestamp, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: (spec) => `TS:${spec.tsType}:${spec.semanticType}:${spec.isDateTime}`,
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(tsResult).toBe('TS:string:datetime:true')
  })

  test('4. matchEloquentCastKind executes pure catamorphism for JSON / Array / Collection / Object kinds', () => {
    const arrayResult = matchEloquentCastKind(EloquentCastKind.Array, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: (spec) => `ARRAY:${spec.tsType}:${spec.isJsonOrCollection}`,
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(arrayResult).toBe('ARRAY:Record<string, unknown>:true')

    const jsonResult = matchEloquentCastKind(EloquentCastKind.Json, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: (spec) => `JSON:${spec.tsType}:${spec.isJsonOrCollection}`,
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(jsonResult).toBe('JSON:Record<string, unknown>:true')

    const objectResult = matchEloquentCastKind(EloquentCastKind.Object, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: (spec) => `OBJECT:${spec.tsType}:${spec.isJsonOrCollection}`,
      collection: () => 'N',
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(objectResult).toBe('OBJECT:Record<string, unknown>:true')

    const collectionResult = matchEloquentCastKind(EloquentCastKind.Collection, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: (spec) => `COLLECTION:${spec.tsType}:${spec.isJsonOrCollection}`,
      encrypted: () => 'N',
      custom: () => 'N'
    })

    expect(collectionResult).toBe('COLLECTION:unknown[]:true')
  })

  test('5. matchEloquentCastKind handles Custom fallback gracefully', () => {
    const customResult = matchEloquentCastKind(EloquentCastKind.Custom, {
      integer: () => 'N',
      float: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      datetime: () => 'N',
      date: () => 'N',
      timestamp: () => 'N',
      array: () => 'N',
      json: () => 'N',
      object: () => 'N',
      collection: () => 'N',
      encrypted: () => 'N',
      custom: (spec) => `CUSTOM:${spec.tsType}:${spec.isNumeric}:${spec.isDateTime}:${spec.isJsonOrCollection}`
    })

    expect(customResult).toBe('CUSTOM:unknown:false:false:false')
  })

  test('6. ELOQUENT_CAST_REGISTRY provides frozen O(1) specifications for all 14 variants', () => {
    expect(Object.isFrozen(ELOQUENT_CAST_REGISTRY)).toBe(true)

    const allKinds = Object.values(EloquentCastKind)
    expect(allKinds).toHaveLength(14)

    for (const kind of allKinds) {
      const spec = ELOQUENT_CAST_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.tsType).toBe('string')
      expect(typeof spec.semanticType).toBe('string')
      expect(typeof spec.isNumeric).toBe('boolean')
      expect(typeof spec.isDateTime).toBe('boolean')
      expect(typeof spec.isJsonOrCollection).toBe('boolean')
    }
  })

  test('7. EloquentCastMapper.map correctly resolves all canonical Laravel $casts aliases', () => {
    // Numeric
    expect(EloquentCastMapper.map('int')).toEqual({ castKind: EloquentCastKind.Integer, semanticType: PrimitiveKind.NUMBER })
    expect(EloquentCastMapper.map('integer')).toEqual({ castKind: EloquentCastKind.Integer, semanticType: PrimitiveKind.NUMBER })
    expect(EloquentCastMapper.map('real')).toEqual({ castKind: EloquentCastKind.Float, semanticType: PrimitiveKind.NUMBER })
    expect(EloquentCastMapper.map('float')).toEqual({ castKind: EloquentCastKind.Float, semanticType: PrimitiveKind.NUMBER })
    expect(EloquentCastMapper.map('double')).toEqual({ castKind: EloquentCastKind.Float, semanticType: PrimitiveKind.NUMBER })
    expect(EloquentCastMapper.map('decimal:2')).toEqual({ castKind: EloquentCastKind.Decimal, semanticType: PrimitiveKind.NUMBER })

    // Boolean & String
    expect(EloquentCastMapper.map('bool')).toEqual({ castKind: EloquentCastKind.Boolean, semanticType: PrimitiveKind.BOOLEAN })
    expect(EloquentCastMapper.map('boolean')).toEqual({ castKind: EloquentCastKind.Boolean, semanticType: PrimitiveKind.BOOLEAN })
    expect(EloquentCastMapper.map('string')).toEqual({ castKind: EloquentCastKind.String, semanticType: PrimitiveKind.STRING })
    expect(EloquentCastMapper.map('encrypted')).toEqual({ castKind: EloquentCastKind.Encrypted, semanticType: PrimitiveKind.STRING })

    // DateTime
    expect(EloquentCastMapper.map('date')).toEqual({ castKind: EloquentCastKind.Date, semanticType: PrimitiveKind.DATETIME })
    expect(EloquentCastMapper.map('datetime')).toEqual({ castKind: EloquentCastKind.DateTime, semanticType: PrimitiveKind.DATETIME })
    expect(EloquentCastMapper.map('datetime:Y-m-d H:i:s')).toEqual({ castKind: EloquentCastKind.DateTime, semanticType: PrimitiveKind.DATETIME })
    expect(EloquentCastMapper.map('custom_datetime')).toEqual({ castKind: EloquentCastKind.DateTime, semanticType: PrimitiveKind.DATETIME })
    expect(EloquentCastMapper.map('timestamp')).toEqual({ castKind: EloquentCastKind.Timestamp, semanticType: PrimitiveKind.DATETIME })

    // JSON / Collections
    expect(EloquentCastMapper.map('array')).toEqual({ castKind: EloquentCastKind.Array, semanticType: PrimitiveKind.STRING })
    expect(EloquentCastMapper.map('json')).toEqual({ castKind: EloquentCastKind.Json, semanticType: PrimitiveKind.STRING })
    expect(EloquentCastMapper.map('object')).toEqual({ castKind: EloquentCastKind.Object, semanticType: PrimitiveKind.STRING })
    expect(EloquentCastMapper.map('collection')).toEqual({ castKind: EloquentCastKind.Collection, semanticType: PrimitiveKind.STRING })

    // Custom class casts
    expect(EloquentCastMapper.map('App\\Casts\\MoneyCast')).toEqual({ castKind: EloquentCastKind.Custom, semanticType: PrimitiveKind.STRING })
    expect(EloquentCastMapper.map('')).toEqual({ castKind: EloquentCastKind.Custom, semanticType: PrimitiveKind.STRING })
  })

  test('8. Pure functional model cast resolver without branching (Zero-if pattern)', () => {
    const modelCasts = [
      { column: 'id', targetType: 'int' },
      { column: 'is_active', targetType: 'boolean' },
      { column: 'published_at', targetType: 'datetime' },
      { column: 'metadata', targetType: 'json' },
      { column: 'tags', targetType: 'collection' },
      { column: 'secret_token', targetType: 'encrypted' },
      { column: 'custom_handler', targetType: 'App\\Casts\\Special' }
    ]

    const resolved = modelCasts.map(cast => {
      const { castKind } = EloquentCastMapper.map(cast.targetType)
      const tsRepresentation = matchEloquentCastKind(castKind, {
        integer: (s) => s.tsType,
        float: (s) => s.tsType,
        decimal: (s) => s.tsType,
        boolean: (s) => s.tsType,
        string: (s) => s.tsType,
        datetime: (s) => s.tsType,
        date: (s) => s.tsType,
        timestamp: (s) => s.tsType,
        array: (s) => s.tsType,
        json: (s) => s.tsType,
        object: (s) => s.tsType,
        collection: (s) => s.tsType,
        encrypted: (s) => s.tsType,
        custom: (s) => s.tsType
      })

      return `${cast.column}: ${tsRepresentation}`
    })

    expect(resolved).toEqual([
      'id: number',
      'is_active: boolean',
      'published_at: string',
      'metadata: Record<string, unknown>',
      'tags: unknown[]',
      'secret_token: string',
      'custom_handler: unknown'
    ])
  })
})
