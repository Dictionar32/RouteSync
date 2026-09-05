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

/**
 * EloquentCastKind
 *
 * Canonical Domain Vocabulary for Eloquent Attribute Casts.
 */
export const EloquentCastKind = Object.freeze({
  Integer: 'integer',
  Float: 'float',
  Decimal: 'decimal',
  Boolean: 'boolean',
  String: 'string',
  DateTime: 'datetime',
  Date: 'date',
  Timestamp: 'timestamp',
  Array: 'array',
  Json: 'json',
  Object: 'object',
  Collection: 'collection',
  Encrypted: 'encrypted',
  Custom: 'custom'
} as const);

export type EloquentCastKind = typeof EloquentCastKind[keyof typeof EloquentCastKind];

export interface EloquentCastKindSpecification<K extends EloquentCastKind = EloquentCastKind> {
  readonly kind: K;
  readonly tsType: string;
  readonly semanticType: PrimitiveKind;
  readonly isNumeric: boolean;
  readonly isDateTime: boolean;
  readonly isJsonOrCollection: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key EloquentCastKind.
 */
export type EloquentCastKindRegistry = {
  readonly [K in EloquentCastKind]: EloquentCastKindSpecification<K>;
};

export const ELOQUENT_CAST_REGISTRY: EloquentCastKindRegistry = Object.freeze({
  [EloquentCastKind.Integer]: {
    kind: EloquentCastKind.Integer,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    isNumeric: true,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Float]: {
    kind: EloquentCastKind.Float,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    isNumeric: true,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Decimal]: {
    kind: EloquentCastKind.Decimal,
    tsType: 'number',
    semanticType: PrimitiveKind.NUMBER,
    isNumeric: true,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Boolean]: {
    kind: EloquentCastKind.Boolean,
    tsType: 'boolean',
    semanticType: PrimitiveKind.BOOLEAN,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.String]: {
    kind: EloquentCastKind.String,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.DateTime]: {
    kind: EloquentCastKind.DateTime,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    isNumeric: false,
    isDateTime: true,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Date]: {
    kind: EloquentCastKind.Date,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    isNumeric: false,
    isDateTime: true,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Timestamp]: {
    kind: EloquentCastKind.Timestamp,
    tsType: 'string',
    semanticType: PrimitiveKind.DATETIME,
    isNumeric: false,
    isDateTime: true,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Array]: {
    kind: EloquentCastKind.Array,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Json]: {
    kind: EloquentCastKind.Json,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Object]: {
    kind: EloquentCastKind.Object,
    tsType: 'Record<string, unknown>',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Collection]: {
    kind: EloquentCastKind.Collection,
    tsType: 'unknown[]',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: true
  },
  [EloquentCastKind.Encrypted]: {
    kind: EloquentCastKind.Encrypted,
    tsType: 'string',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  },
  [EloquentCastKind.Custom]: {
    kind: EloquentCastKind.Custom,
    tsType: 'unknown',
    semanticType: PrimitiveKind.STRING,
    isNumeric: false,
    isDateTime: false,
    isJsonOrCollection: false
  }
});

export type EloquentCastKindVisitor<R> = {
  readonly [K in EloquentCastKind]: (spec: EloquentCastKindSpecification<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian EloquentCastKind dengan exhaustive type safety
 */
export function matchEloquentCastKind<R>(
  kind: EloquentCastKind,
  visitor: EloquentCastKindVisitor<R>
): R {
  const spec = ELOQUENT_CAST_REGISTRY[kind] ?? ELOQUENT_CAST_REGISTRY[EloquentCastKind.Custom];
  return visitor[kind](spec as any);
}

/**
 * EloquentCastMapper
 *
 * Canonical Mapper from Laravel $casts string to EloquentCastKind and PrimitiveKind.
 * Pure O(1) dictionary lookup (0 regex, 0 .includes()).
 */
export class EloquentCastMapper {
  private static readonly CAST_MAP: Readonly<Record<string, EloquentCastKind>> = Object.freeze({
    'int': EloquentCastKind.Integer,
    'integer': EloquentCastKind.Integer,
    'real': EloquentCastKind.Float,
    'float': EloquentCastKind.Float,
    'double': EloquentCastKind.Float,
    'decimal': EloquentCastKind.Decimal,
    'string': EloquentCastKind.String,
    'bool': EloquentCastKind.Boolean,
    'boolean': EloquentCastKind.Boolean,
    'object': EloquentCastKind.Object,
    'array': EloquentCastKind.Array,
    'json': EloquentCastKind.Json,
    'collection': EloquentCastKind.Collection,
    'date': EloquentCastKind.Date,
    'datetime': EloquentCastKind.DateTime,
    'custom_datetime': EloquentCastKind.DateTime,
    'timestamp': EloquentCastKind.Timestamp,
    'encrypted': EloquentCastKind.Encrypted,
    'hashed': EloquentCastKind.String,
    'asarrayobject': EloquentCastKind.Object,
    'ascollection': EloquentCastKind.Collection,
    'asenumcollection': EloquentCastKind.Collection,
    'immutable_date': EloquentCastKind.Date,
    'immutable_datetime': EloquentCastKind.DateTime
  });

  public static map(rawTargetType: string): { readonly castKind: EloquentCastKind; readonly semanticType: PrimitiveKind } {
    const clean = (rawTargetType || '').split(':')[0].trim().toLowerCase();
    const kind = this.CAST_MAP[clean] ?? EloquentCastKind.Custom;
    const spec = ELOQUENT_CAST_REGISTRY[kind];
    return { castKind: spec.kind, semanticType: spec.semanticType };
  }
}

/**
 * First-Class Eloquent Attribute Cast Entry (Ordered & Guaranteed Complete Model).
 */
export interface ParsedCast {
  readonly column: string;
  readonly targetType: string;
  readonly castKind: EloquentCastKind;
  readonly semanticType: PrimitiveKind;
}

/**
 * First-Class Eloquent Accessor Definition (Ordered).
 */
export interface ParsedAccessor {
  readonly name: string;
  readonly propertyName: string; // ✅ Canonical TS Identifier ('fullName')
  readonly type: string;         // PHP return type
  readonly nullable: boolean;    // Guaranteed boolean
  readonly semanticType: PrimitiveKind; // ✅ Guaranteed Domain Primitive
}

/**
 * EloquentRelationType
 *
 * Canonical Domain Vocabulary for Eloquent ORM Relationships.
 */
export const EloquentRelationType = Object.freeze({
  HasOne: 'hasOne',
  HasMany: 'hasMany',
  BelongsTo: 'belongsTo',
  BelongsToMany: 'belongsToMany',
  HasOneThrough: 'hasOneThrough',
  HasManyThrough: 'hasManyThrough',
  MorphTo: 'morphTo',
  MorphOne: 'morphOne',
  MorphMany: 'morphMany',
  MorphToMany: 'morphToMany',
  MorphedByMany: 'morphedByMany'
} as const);

export type EloquentRelationType = typeof EloquentRelationType[keyof typeof EloquentRelationType];

export type EloquentRelationCardinality = 'one' | 'many';

export interface EloquentRelationDescriptor<T extends EloquentRelationType = EloquentRelationType> {
  readonly type: T;
  readonly cardinality: EloquentRelationCardinality;
  readonly isCollection: boolean;
  readonly isPolymorphic: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key EloquentRelationType (0 string key).
 */
export type EloquentRelationRegistry = {
  readonly [K in EloquentRelationType]: EloquentRelationDescriptor<K>;
};

export const ELOQUENT_RELATION_REGISTRY: EloquentRelationRegistry = Object.freeze({
  [EloquentRelationType.HasOne]: {
    type: EloquentRelationType.HasOne,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: false
  },
  [EloquentRelationType.HasMany]: {
    type: EloquentRelationType.HasMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: false
  },
  [EloquentRelationType.BelongsTo]: {
    type: EloquentRelationType.BelongsTo,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: false
  },
  [EloquentRelationType.BelongsToMany]: {
    type: EloquentRelationType.BelongsToMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: false
  },
  [EloquentRelationType.HasOneThrough]: {
    type: EloquentRelationType.HasOneThrough,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: false
  },
  [EloquentRelationType.HasManyThrough]: {
    type: EloquentRelationType.HasManyThrough,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: false
  },
  [EloquentRelationType.MorphTo]: {
    type: EloquentRelationType.MorphTo,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphOne]: {
    type: EloquentRelationType.MorphOne,
    cardinality: 'one',
    isCollection: false,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphMany]: {
    type: EloquentRelationType.MorphMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphToMany]: {
    type: EloquentRelationType.MorphToMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: true
  },
  [EloquentRelationType.MorphedByMany]: {
    type: EloquentRelationType.MorphedByMany,
    cardinality: 'many',
    isCollection: true,
    isPolymorphic: true
  }
});

/**
 * EloquentRelationClassifier
 *
 * Canonical Classifier for Eloquent ORM Relationships.
 * Strict Type Guard & Mapped Lookup (0 Record<string, ...>).
 */
export class EloquentRelationClassifier {
  public static isRelationMethod(name: string): name is EloquentRelationType {
    return Object.prototype.hasOwnProperty.call(ELOQUENT_RELATION_REGISTRY, name);
  }

  public static getDescriptor<K extends EloquentRelationType>(type: K): EloquentRelationDescriptor<K> {
    return ELOQUENT_RELATION_REGISTRY[type];
  }

  public static isCollection(type: EloquentRelationType): boolean {
    return ELOQUENT_RELATION_REGISTRY[type]?.isCollection ?? false;
  }

  public static isPolymorphic(type: EloquentRelationType): boolean {
    return ELOQUENT_RELATION_REGISTRY[type]?.isPolymorphic ?? false;
  }
}

/**
 * First-Class Eloquent Model Relationship Definition (Ordered & Complete Contract).
 */
export interface ParsedRelation {
  readonly name: string;
  readonly type: EloquentRelationType;
  readonly modelName: string;
  readonly targetModel: string;
  readonly cardinality: EloquentRelationCardinality;
  readonly isCollection: boolean;
  readonly foreignKey: string | null;
}

export interface SingleRelationDescriptor extends ParsedRelation {
  readonly cardinality: 'one';
  readonly isCollection: false;
}

export interface CollectionRelationDescriptor extends ParsedRelation {
  readonly cardinality: 'many';
  readonly isCollection: true;
}

export type RelationCardinalityDescriptor =
  | SingleRelationDescriptor
  | CollectionRelationDescriptor;

export interface RelationCardinalityVisitor<R> {
  readonly one: (relation: SingleRelationDescriptor) => R;
  readonly many: (relation: CollectionRelationDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik kardinalitas relasi Eloquent
 */
export function matchRelationCardinality<R>(
  relation: ParsedRelation,
  visitor: RelationCardinalityVisitor<R>
): R {
  const cardinality = relation.cardinality ?? (relation.isCollection ? 'many' : 'one');
  return visitor[cardinality](relation as any);
}

export const matchRelation = matchRelationCardinality;

export interface EloquentRelationTypeVisitor<R> {
  readonly hasOne: (rel: ParsedRelation) => R;
  readonly hasMany: (rel: ParsedRelation) => R;
  readonly belongsTo: (rel: ParsedRelation) => R;
  readonly belongsToMany: (rel: ParsedRelation) => R;
  readonly hasOneThrough: (rel: ParsedRelation) => R;
  readonly hasManyThrough: (rel: ParsedRelation) => R;
  readonly morphTo: (rel: ParsedRelation) => R;
  readonly morphOne: (rel: ParsedRelation) => R;
  readonly morphMany: (rel: ParsedRelation) => R;
  readonly morphToMany: (rel: ParsedRelation) => R;
  readonly morphedByMany: (rel: ParsedRelation) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik tipe relasi Eloquent
 */
export function matchRelationType<R>(
  relation: ParsedRelation,
  visitor: EloquentRelationTypeVisitor<R>
): R {
  return visitor[relation.type](relation);
}

/**
 * ModelKeyType
 *
 * Canonical Domain Vocabulary for Eloquent Model Primary Keys.
 */
export const ModelKeyType = Object.freeze({
  Int: 'int',
  BigInt: 'bigint',
  String: 'string',
  Uuid: 'uuid',
  Ulid: 'ulid'
} as const);

export type ModelKeyType = typeof ModelKeyType[keyof typeof ModelKeyType];

export interface ModelKeyTypeSpecification<T extends ModelKeyType = ModelKeyType> {
  readonly type: T;
  readonly tsType: 'number' | 'string';
  readonly isNumeric: boolean;
  readonly isStringLike: boolean;
  readonly primitiveKind: PrimitiveKind;
  readonly sampleValue: number | string;
  readonly description: string;
}

export type ModelKeyTypeRegistry = {
  readonly [K in ModelKeyType]: ModelKeyTypeSpecification<K>;
};

export const MODEL_KEY_TYPE_REGISTRY: ModelKeyTypeRegistry = Object.freeze({
  [ModelKeyType.Int]: {
    type: ModelKeyType.Int,
    tsType: 'number',
    isNumeric: true,
    isStringLike: false,
    primitiveKind: PrimitiveKind.NUMBER,
    sampleValue: 1,
    description: 'Integer primary key (auto-incrementing)'
  },
  [ModelKeyType.BigInt]: {
    type: ModelKeyType.BigInt,
    tsType: 'number',
    isNumeric: true,
    isStringLike: false,
    primitiveKind: PrimitiveKind.NUMBER,
    sampleValue: 1,
    description: 'BigInteger primary key'
  },
  [ModelKeyType.String]: {
    type: ModelKeyType.String,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    primitiveKind: PrimitiveKind.STRING,
    sampleValue: 'id_sample',
    description: 'String primary key'
  },
  [ModelKeyType.Uuid]: {
    type: ModelKeyType.Uuid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    primitiveKind: PrimitiveKind.STRING,
    sampleValue: '00000000-0000-0000-0000-000000000000',
    description: 'UUID primary key'
  },
  [ModelKeyType.Ulid]: {
    type: ModelKeyType.Ulid,
    tsType: 'string',
    isNumeric: false,
    isStringLike: true,
    primitiveKind: PrimitiveKind.STRING,
    sampleValue: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    description: 'ULID primary key'
  }
});

export type ModelKeyTypeVisitor<R> = {
  readonly int: (spec: ModelKeyTypeSpecification<'int'>) => R;
  readonly bigint: (spec: ModelKeyTypeSpecification<'bigint'>) => R;
  readonly string: (spec: ModelKeyTypeSpecification<'string'>) => R;
  readonly uuid: (spec: ModelKeyTypeSpecification<'uuid'>) => R;
  readonly ulid: (spec: ModelKeyTypeSpecification<'ulid'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik ModelKeyType dengan exhaustive type safety
 */
export function matchModelKeyType<R>(
  typeOrModel: ModelKeyType | { readonly keyType: ModelKeyType },
  visitor: ModelKeyTypeVisitor<R>
): R {
  const type = typeof typeOrModel === 'string' ? typeOrModel : typeOrModel.keyType;
  const spec = MODEL_KEY_TYPE_REGISTRY[type];
  return visitor[type](spec as any);
}

/**
 * ModelKeyTypeMapper
 *
 * O(1) canonical dictionary normalization for model primary key types.
 */
export class ModelKeyTypeMapper {
  private static readonly NORMALIZATION_MAP: Readonly<Record<string, ModelKeyType>> = Object.freeze({
    int: ModelKeyType.Int,
    integer: ModelKeyType.Int,
    bigint: ModelKeyType.BigInt,
    string: ModelKeyType.String,
    uuid: ModelKeyType.Uuid,
    ulid: ModelKeyType.Ulid
  });

  public static normalize(rawKeyType?: string | null): ModelKeyType {
    if (!rawKeyType) return ModelKeyType.Int;
    return this.NORMALIZATION_MAP[rawKeyType.toLowerCase()] ?? ModelKeyType.Int;
  }
}


/**
 * Pure Ordered Eloquent Model AST (0 Record, 0 Object.entries).
 */
export interface ParsedModel {
  readonly name: string;       // e.g. 'App\\Models\\User'
  readonly shortName: string;  // e.g. 'User' (Guaranteed from class_basename in PHP)
  readonly table: string;
  readonly primaryKey: string; // ✅ Guaranteed ('id')
  readonly keyType: ModelKeyType; // ✅ Guaranteed ('int' | 'bigint' | 'uuid')
  readonly keySemanticType: PrimitiveKind; // ✅ Guaranteed (PrimitiveKind.NUMBER | STRING)
  readonly incrementing: boolean; // ✅ Guaranteed boolean
  readonly softDeletes: boolean;  // ✅ Guaranteed boolean (true if SoftDeletes trait or deleted_at column present)
  readonly timestamps: boolean;   // ✅ Guaranteed boolean (true if created_at & updated_at columns present)
  readonly columns: readonly ParsedColumn[];
  readonly fillable: readonly string[];
  readonly guarded: readonly string[];
  readonly hidden: readonly string[];
  readonly appends: readonly string[];
  readonly casts: readonly ParsedCast[];
  readonly accessors: readonly ParsedAccessor[];
  readonly relations: readonly ParsedRelation[];
}

