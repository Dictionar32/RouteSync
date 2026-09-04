import { describe, test, expect } from 'vitest'
import {
  matchDatabaseColumnKind,
  DATABASE_COLUMN_KIND_REGISTRY,
  DatabaseColumnKind,
  DatabaseColumnTypeMapper,
  PrimitiveKind
} from '../../core/src'

describe('DatabaseColumnKind ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchDatabaseColumnKind executes pure catamorphism for Numeric column kinds', () => {
    const bigIntType = matchDatabaseColumnKind(DatabaseColumnKind.BigInt, {
      bigint: (spec) => `BIGINT:${spec.tsType}:${spec.sqlFamily}:${spec.isNumeric}`,
      integer: () => 'INT',
      smallint: () => 'SMALLINT',
      tinyint: () => 'TINYINT',
      float: () => 'FLOAT',
      double: () => 'DOUBLE',
      decimal: () => 'DECIMAL',
      boolean: () => 'BOOL',
      string: () => 'STRING',
      text: () => 'TEXT',
      mediumtext: () => 'MEDIUMTEXT',
      longtext: () => 'LONGTEXT',
      date: () => 'DATE',
      datetime: () => 'DATETIME',
      timestamp: () => 'TIMESTAMP',
      time: () => 'TIME',
      json: () => 'JSON',
      enum: () => 'ENUM',
      binary: () => 'BINARY',
      uuid: () => 'UUID',
      ulid: () => 'ULID',
      unknown: () => 'UNKNOWN'
    })

    expect(bigIntType).toBe('BIGINT:number:numeric:true')
  })

  test('2. matchDatabaseColumnKind executes pure catamorphism for DateTime & Boolean kinds', () => {
    const boolType = matchDatabaseColumnKind(DatabaseColumnKind.Boolean, {
      bigint: () => 'N',
      integer: () => 'N',
      smallint: () => 'N',
      tinyint: () => 'N',
      float: () => 'N',
      double: () => 'N',
      decimal: () => 'N',
      boolean: (spec) => `BOOL:${spec.tsType}:${spec.semanticType}:${spec.sqlFamily}`,
      string: () => 'N',
      text: () => 'N',
      mediumtext: () => 'N',
      longtext: () => 'N',
      date: () => 'N',
      datetime: () => 'N',
      timestamp: () => 'N',
      time: () => 'N',
      json: () => 'N',
      enum: () => 'N',
      binary: () => 'N',
      uuid: () => 'N',
      ulid: () => 'N',
      unknown: () => 'N'
    })

    const dateType = matchDatabaseColumnKind(DatabaseColumnKind.DateTime, {
      bigint: () => 'N',
      integer: () => 'N',
      smallint: () => 'N',
      tinyint: () => 'N',
      float: () => 'N',
      double: () => 'N',
      decimal: () => 'N',
      boolean: () => 'N',
      string: () => 'N',
      text: () => 'N',
      mediumtext: () => 'N',
      longtext: () => 'N',
      date: () => 'N',
      datetime: (spec) => `DATETIME:${spec.tsType}:${spec.isDateTime}:${spec.sqlFamily}`,
      timestamp: () => 'N',
      time: () => 'N',
      json: () => 'N',
      enum: () => 'N',
      binary: () => 'N',
      uuid: () => 'N',
      ulid: () => 'N',
      unknown: () => 'N'
    })

    expect(boolType).toBe('BOOL:boolean:boolean:boolean')
    expect(dateType).toBe('DATETIME:string:true:datetime')
  })

  test('3. DATABASE_COLUMN_KIND_REGISTRY enforces frozen specifications for all 22 database column kinds', () => {
    expect(Object.isFrozen(DATABASE_COLUMN_KIND_REGISTRY)).toBe(true)

    // Check numeric family
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.BigInt].isNumeric).toBe(true)
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Integer].isNumeric).toBe(true)
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Decimal].isNumeric).toBe(true)
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Float].isNumeric).toBe(true)

    // Check boolean
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Boolean].tsType).toBe('boolean')
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Boolean].semanticType).toBe(PrimitiveKind.BOOLEAN)

    // Check json
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Json].tsType).toBe('Record<string, unknown>')
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Json].sqlFamily).toBe('json')

    // Check datetime family
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Date].isDateTime).toBe(true)
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.DateTime].isDateTime).toBe(true)
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Timestamp].isDateTime).toBe(true)

    // Check identifiers
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Uuid].sqlFamily).toBe('identifier')
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Ulid].sqlFamily).toBe('identifier')

    // Check unknown fallback
    expect(DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Unknown].tsType).toBe('unknown')
  })

  test('4. DatabaseColumnTypeMapper.toColumnKind resolves SQL types in O(1) without switch branching', () => {
    expect(DatabaseColumnTypeMapper.toColumnKind('bigint(20) unsigned')).toBe(DatabaseColumnKind.BigInt)
    expect(DatabaseColumnTypeMapper.toColumnKind('int(11)')).toBe(DatabaseColumnKind.Integer)
    expect(DatabaseColumnTypeMapper.toColumnKind('integer')).toBe(DatabaseColumnKind.Integer)
    expect(DatabaseColumnTypeMapper.toColumnKind('smallint')).toBe(DatabaseColumnKind.SmallInt)
    expect(DatabaseColumnTypeMapper.toColumnKind('tinyint')).toBe(DatabaseColumnKind.TinyInt)
    expect(DatabaseColumnTypeMapper.toColumnKind('decimal(10,2)')).toBe(DatabaseColumnKind.Decimal)
    expect(DatabaseColumnTypeMapper.toColumnKind('numeric')).toBe(DatabaseColumnKind.Decimal)
    expect(DatabaseColumnTypeMapper.toColumnKind('float')).toBe(DatabaseColumnKind.Float)
    expect(DatabaseColumnTypeMapper.toColumnKind('double')).toBe(DatabaseColumnKind.Double)
    expect(DatabaseColumnTypeMapper.toColumnKind('boolean')).toBe(DatabaseColumnKind.Boolean)
    expect(DatabaseColumnTypeMapper.toColumnKind('bool')).toBe(DatabaseColumnKind.Boolean)
    expect(DatabaseColumnTypeMapper.toColumnKind('varchar(255)')).toBe(DatabaseColumnKind.String)
    expect(DatabaseColumnTypeMapper.toColumnKind('char(2)')).toBe(DatabaseColumnKind.String)
    expect(DatabaseColumnTypeMapper.toColumnKind('text')).toBe(DatabaseColumnKind.Text)
    expect(DatabaseColumnTypeMapper.toColumnKind('mediumtext')).toBe(DatabaseColumnKind.MediumText)
    expect(DatabaseColumnTypeMapper.toColumnKind('longtext')).toBe(DatabaseColumnKind.LongText)
    expect(DatabaseColumnTypeMapper.toColumnKind('datetime')).toBe(DatabaseColumnKind.DateTime)
    expect(DatabaseColumnTypeMapper.toColumnKind('date')).toBe(DatabaseColumnKind.Date)
    expect(DatabaseColumnTypeMapper.toColumnKind('timestamp')).toBe(DatabaseColumnKind.Timestamp)
    expect(DatabaseColumnTypeMapper.toColumnKind('time')).toBe(DatabaseColumnKind.Time)
    expect(DatabaseColumnTypeMapper.toColumnKind('json')).toBe(DatabaseColumnKind.Json)
    expect(DatabaseColumnTypeMapper.toColumnKind('jsonb')).toBe(DatabaseColumnKind.Json)
    expect(DatabaseColumnTypeMapper.toColumnKind('enum')).toBe(DatabaseColumnKind.Enum)
    expect(DatabaseColumnTypeMapper.toColumnKind('blob')).toBe(DatabaseColumnKind.Binary)
    expect(DatabaseColumnTypeMapper.toColumnKind('binary')).toBe(DatabaseColumnKind.Binary)
    expect(DatabaseColumnTypeMapper.toColumnKind('uuid')).toBe(DatabaseColumnKind.Uuid)
    expect(DatabaseColumnTypeMapper.toColumnKind('ulid')).toBe(DatabaseColumnKind.Ulid)
    expect(DatabaseColumnTypeMapper.toColumnKind('geography')).toBe(DatabaseColumnKind.Unknown)
  })

  test('5. DatabaseColumnTypeMapper.toPrimitiveKind resolves tinyint(1) and standard columns', () => {
    expect(DatabaseColumnTypeMapper.toPrimitiveKind('tinyint(1)')).toBe(PrimitiveKind.BOOLEAN)
    expect(DatabaseColumnTypeMapper.toPrimitiveKind('tinyint(1) unsigned')).toBe(PrimitiveKind.BOOLEAN)
    expect(DatabaseColumnTypeMapper.toPrimitiveKind('bigint(20)')).toBe(PrimitiveKind.NUMBER)
    expect(DatabaseColumnTypeMapper.toPrimitiveKind('varchar(100)')).toBe(PrimitiveKind.STRING)
    expect(DatabaseColumnTypeMapper.toPrimitiveKind('datetime')).toBe(PrimitiveKind.DATETIME)
  })

  test('6. Pure catamorphism folds database columns into TypeScript interface fields', () => {
    const columns = [
      { name: 'id', kind: DatabaseColumnKind.BigInt },
      { name: 'email', kind: DatabaseColumnKind.String },
      { name: 'is_active', kind: DatabaseColumnKind.Boolean },
      { name: 'metadata', kind: DatabaseColumnKind.Json }
    ]

    const tsFields = columns.map(c => {
      const tsType = DATABASE_COLUMN_KIND_REGISTRY[c.kind].tsType
      return `${c.name}: ${tsType}`
    })

    expect(tsFields).toEqual([
      'id: number',
      'email: string',
      'is_active: boolean',
      'metadata: Record<string, unknown>'
    ])
  })
})
