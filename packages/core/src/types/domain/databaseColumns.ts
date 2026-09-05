import { PrimitiveKind } from "../../compiler/types/SemanticType";

/**
 * DatabaseColumnKind
 *
 * Canonical Domain Vocabulary for Database Column Engine Types.
 */
export const DatabaseColumnKind = Object.freeze({
  BigInt: 'bigint',
  Integer: 'integer',
  SmallInt: 'smallint',
  TinyInt: 'tinyint',
  Float: 'float',
  Double: 'double',
  Decimal: 'decimal',
  Boolean: 'boolean',
  String: 'string',
  Text: 'text',
  MediumText: 'mediumtext',
  LongText: 'longtext',
  Date: 'date',
  DateTime: 'datetime',
  Timestamp: 'timestamp',
  Time: 'time',
  Json: 'json',
  Enum: 'enum',
  Binary: 'binary',
  Uuid: 'uuid',
  Ulid: 'ulid',
  Unknown: 'unknown'
} as const);

export type DatabaseColumnKind = typeof DatabaseColumnKind[keyof typeof DatabaseColumnKind];

export type SqlTypeFamily =
  | 'numeric'
  | 'text'
  | 'datetime'
  | 'boolean'
  | 'json'
  | 'enum'
  | 'binary'
  | 'identifier'
  | 'unknown';

export interface DatabaseColumnKindSpecification<K extends DatabaseColumnKind = DatabaseColumnKind> {
  readonly kind: K;
  readonly tsType: string;
  readonly semanticType: PrimitiveKind;
  readonly sqlFamily: SqlTypeFamily;
  readonly isNumeric: boolean;
  readonly isDateTime: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key DatabaseColumnKind.
 */
export type DatabaseColumnKindRegistry = {
  readonly [K in DatabaseColumnKind]: DatabaseColumnKindSpecification<K>;
};

export const DATABASE_COLUMN_KIND_REGISTRY: DatabaseColumnKindRegistry = Object.freeze({
  [DatabaseColumnKind.BigInt]: {
    kind: DatabaseColumnKind.BigInt,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Integer]: {
    kind: DatabaseColumnKind.Integer,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.SmallInt]: {
    kind: DatabaseColumnKind.SmallInt,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.TinyInt]: {
    kind: DatabaseColumnKind.TinyInt,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Float]: {
    kind: DatabaseColumnKind.Float,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Double]: {
    kind: DatabaseColumnKind.Double,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Decimal]: {
    kind: DatabaseColumnKind.Decimal,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    sqlFamily: 'numeric',
    isNumeric: true,
    isDateTime: false
  },
  [DatabaseColumnKind.Boolean]: {
    kind: DatabaseColumnKind.Boolean,
    tsType: 'boolean',
    semanticType: PrimitiveKind.BOOLEAN,
    sqlFamily: 'boolean',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.String]: {
    kind: DatabaseColumnKind.String,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Text]: {
    kind: DatabaseColumnKind.Text,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.MediumText]: {
    kind: DatabaseColumnKind.MediumText,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.LongText]: {
    kind: DatabaseColumnKind.LongText,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'text',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Date]: {
    kind: DatabaseColumnKind.Date,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: true
  },
  [DatabaseColumnKind.DateTime]: {
    kind: DatabaseColumnKind.DateTime,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: true
  },
  [DatabaseColumnKind.Timestamp]: {
    kind: DatabaseColumnKind.Timestamp,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: true
  },
  [DatabaseColumnKind.Time]: {
    kind: DatabaseColumnKind.Time,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'datetime',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Json]: {
    kind: DatabaseColumnKind.Json,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'json',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Enum]: {
    kind: DatabaseColumnKind.Enum,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'enum',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Binary]: {
    kind: DatabaseColumnKind.Binary,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'binary',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Uuid]: {
    kind: DatabaseColumnKind.Uuid,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'identifier',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Ulid]: {
    kind: DatabaseColumnKind.Ulid,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'identifier',
    isNumeric: false,
    isDateTime: false
  },
  [DatabaseColumnKind.Unknown]: {
    kind: DatabaseColumnKind.Unknown,
    tsType: 'unknown',
    semanticType: PrimitiveKind.STRING,
    sqlFamily: 'unknown',
    isNumeric: false,
    isDateTime: false
  }
});

export type DatabaseColumnKindVisitor<R> = {
  readonly [K in DatabaseColumnKind]: (spec: DatabaseColumnKindSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian DatabaseColumnKind dengan exhaustive type safety
 */
export function matchDatabaseColumnKind<R>(
  kind: DatabaseColumnKind,
  visitor: DatabaseColumnKindVisitor<R>
): R {
  const spec = DATABASE_COLUMN_KIND_REGISTRY[kind] ?? DATABASE_COLUMN_KIND_REGISTRY[DatabaseColumnKind.Unknown];
  return visitor[kind](spec as any);
}

/**
 * Canonical Mapping of Database & Migration Column Types to PrimitiveKind and DatabaseColumnKind.
 * Pure Zero-Regex, Direct O(1) Dictionary Lookup (0 .includes string searching, 0 switch).
 */
export class DatabaseColumnTypeMapper {
  private static readonly TYPE_MAP: Readonly<Record<string, PrimitiveKind>> = Object.freeze({
    'int': PrimitiveKind.NUMBER,
    'integer': PrimitiveKind.NUMBER,
    'tinyint': PrimitiveKind.NUMBER,
    'smallint': PrimitiveKind.NUMBER,
    'mediumint': PrimitiveKind.NUMBER,
    'bigint': PrimitiveKind.NUMBER,
    'unsignedbigint': PrimitiveKind.NUMBER,
    'unsignedinteger': PrimitiveKind.NUMBER,
    'unsignedmediumint': PrimitiveKind.NUMBER,
    'unsignedsmallint': PrimitiveKind.NUMBER,
    'unsignedtinyint': PrimitiveKind.NUMBER,
    'decimal': PrimitiveKind.NUMBER,
    'float': PrimitiveKind.NUMBER,
    'double': PrimitiveKind.NUMBER,
    'numeric': PrimitiveKind.NUMBER,
    'real': PrimitiveKind.NUMBER,
    'number': PrimitiveKind.NUMBER,
    'bool': PrimitiveKind.BOOLEAN,
    'boolean': PrimitiveKind.BOOLEAN,
    'datetime': PrimitiveKind.DATETIME,
    'date': PrimitiveKind.DATETIME,
    'timestamp': PrimitiveKind.DATETIME,
    'time': PrimitiveKind.STRING,
    'file': PrimitiveKind.FILE,
    'image': PrimitiveKind.FILE,
    'string': PrimitiveKind.STRING,
    'varchar': PrimitiveKind.STRING,
    'char': PrimitiveKind.STRING,
    'text': PrimitiveKind.STRING,
    'mediumtext': PrimitiveKind.STRING,
    'longtext': PrimitiveKind.STRING,
    'tinytext': PrimitiveKind.STRING,
    'json': PrimitiveKind.STRING,
    'jsonb': PrimitiveKind.STRING,
    'uuid': PrimitiveKind.STRING,
    'ulid': PrimitiveKind.STRING
  });

  private static readonly COLUMN_KIND_MAP: Readonly<Record<string, DatabaseColumnKind>> = Object.freeze({
    'bigint': DatabaseColumnKind.BigInt,
    'int': DatabaseColumnKind.Integer,
    'integer': DatabaseColumnKind.Integer,
    'smallint': DatabaseColumnKind.SmallInt,
    'tinyint': DatabaseColumnKind.TinyInt,
    'float': DatabaseColumnKind.Float,
    'double': DatabaseColumnKind.Double,
    'decimal': DatabaseColumnKind.Decimal,
    'numeric': DatabaseColumnKind.Decimal,
    'real': DatabaseColumnKind.Float,
    'bool': DatabaseColumnKind.Boolean,
    'boolean': DatabaseColumnKind.Boolean,
    'varchar': DatabaseColumnKind.String,
    'char': DatabaseColumnKind.String,
    'string': DatabaseColumnKind.String,
    'text': DatabaseColumnKind.Text,
    'mediumtext': DatabaseColumnKind.MediumText,
    'longtext': DatabaseColumnKind.LongText,
    'tinytext': DatabaseColumnKind.Text,
    'date': DatabaseColumnKind.Date,
    'datetime': DatabaseColumnKind.DateTime,
    'timestamp': DatabaseColumnKind.Timestamp,
    'time': DatabaseColumnKind.Time,
    'json': DatabaseColumnKind.Json,
    'jsonb': DatabaseColumnKind.Json,
    'enum': DatabaseColumnKind.Enum,
    'blob': DatabaseColumnKind.Binary,
    'binary': DatabaseColumnKind.Binary,
    'uuid': DatabaseColumnKind.Uuid,
    'ulid': DatabaseColumnKind.Ulid
  });

  /**
   * Resolves raw database/migration column type into PrimitiveKind.
   * Guaranteed O(1) direct dictionary resolution.
   */
  public static toPrimitiveKind(rawType: string): PrimitiveKind {
    const rawLower = (rawType || '').trim().toLowerCase();
    if (rawLower === 'tinyint(1)' || rawLower.startsWith('tinyint(1)')) {
      return PrimitiveKind.BOOLEAN;
    }
    const cleanType = (rawType || '').split('(')[0].split(' ')[0].trim().toLowerCase();
    return (this.TYPE_MAP[cleanType] as PrimitiveKind) ?? 'string';
  }

  /**
   * Resolves raw database/migration column type into DatabaseColumnKind.
   * Guaranteed O(1) direct dictionary resolution (0 switch).
   */
  public static toColumnKind(rawType: string): DatabaseColumnKind {
    const cleanType = (rawType || '').split('(')[0].split(' ')[0].trim().toLowerCase();
    return this.COLUMN_KIND_MAP[cleanType] ?? DatabaseColumnKind.Unknown;
  }
}

export interface ParsedColumn {
  readonly name: string;
  readonly propertyName: string; // ✅ Canonical TS Identifier ('createdAt')
  readonly type: string;         // SQL Type ('bigint(20) unsigned' | 'enum')
  readonly columnKind: DatabaseColumnKind; // ✅ Canonical Database Column Kind (Guaranteed)
  readonly nullable: boolean;    // Guaranteed boolean
  readonly semanticType: PrimitiveKind; // ✅ Guaranteed Domain Primitive
  readonly enumValues: readonly string[]; // ✅ Preserved literal enum values (e.g. ['pending', 'completed'])
}
