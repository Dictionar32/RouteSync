import type { SemanticType } from "../../compiler/types/SemanticType";
import { PrimitiveKind } from "../../compiler/types/SemanticType";

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
  switch (kind) {
    case EloquentCastKind.Integer: return visitor.integer(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Integer]);
    case EloquentCastKind.Float: return visitor.float(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Float]);
    case EloquentCastKind.Decimal: return visitor.decimal(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Decimal]);
    case EloquentCastKind.Boolean: return visitor.boolean(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Boolean]);
    case EloquentCastKind.String: return visitor.string(ELOQUENT_CAST_REGISTRY[EloquentCastKind.String]);
    case EloquentCastKind.DateTime: return visitor.datetime(ELOQUENT_CAST_REGISTRY[EloquentCastKind.DateTime]);
    case EloquentCastKind.Date: return visitor.date(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Date]);
    case EloquentCastKind.Timestamp: return visitor.timestamp(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Timestamp]);
    case EloquentCastKind.Array: return visitor.array(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Array]);
    case EloquentCastKind.Json: return visitor.json(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Json]);
    case EloquentCastKind.Object: return visitor.object(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Object]);
    case EloquentCastKind.Collection: return visitor.collection(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Collection]);
    case EloquentCastKind.Encrypted: return visitor.encrypted(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Encrypted]);
    case EloquentCastKind.Custom: return visitor.custom(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Custom]);
  }
}

/**
 * EloquentCastMapper
 *
 * Canonical Mapper from Laravel $casts string to EloquentCastKind and PrimitiveKind.
 * Pure O(1) dictionary lookup (0 regex, 0 .includes()).
 */
export class EloquentCastMapper {
  private static readonly CAST_MAP: ReadonlyMap<string, EloquentCastKind> = new Map([
    ['int', EloquentCastKind.Integer],
    ['integer', EloquentCastKind.Integer],
    ['real', EloquentCastKind.Float],
    ['float', EloquentCastKind.Float],
    ['double', EloquentCastKind.Float],
    ['decimal', EloquentCastKind.Decimal],
    ['string', EloquentCastKind.String],
    ['bool', EloquentCastKind.Boolean],
    ['boolean', EloquentCastKind.Boolean],
    ['object', EloquentCastKind.Object],
    ['array', EloquentCastKind.Array],
    ['json', EloquentCastKind.Json],
    ['collection', EloquentCastKind.Collection],
    ['date', EloquentCastKind.Date],
    ['datetime', EloquentCastKind.DateTime],
    ['custom_datetime', EloquentCastKind.DateTime],
    ['timestamp', EloquentCastKind.Timestamp],
    ['encrypted', EloquentCastKind.Encrypted],
    ['hashed', EloquentCastKind.String],
    ['asarrayobject', EloquentCastKind.Object],
    ['ascollection', EloquentCastKind.Collection],
    ['asenumcollection', EloquentCastKind.Collection],
    ['immutable_date', EloquentCastKind.Date],
    ['immutable_datetime', EloquentCastKind.DateTime]
  ]);

  public static map(rawTargetType: string): { readonly castKind: EloquentCastKind; readonly semanticType: PrimitiveKind } {
    const clean = (rawTargetType || '').split(':')[0].trim().toLowerCase();
    const kind = this.CAST_MAP.get(clean) ?? EloquentCastKind.Custom;
    const spec = ELOQUENT_CAST_REGISTRY[kind];
    return { castKind: spec.kind, semanticType: spec.semanticType };
  }
}

/**
 * First-Class Eloquent Attribute Cast Entry (Ordered & Guaranteed Complete Model).
 */
export type EloquentCastTarget =
  | { readonly kind: 'builtin'; readonly castKind: EloquentCastKind }
  | { readonly kind: 'custom'; readonly className: string };

/** First-class Eloquent attribute cast contract. */
export interface ParsedCast {
  readonly column: string;
  readonly target: EloquentCastTarget;
  readonly castKind: EloquentCastKind;
  readonly semanticType: SemanticType;
}

/** First-class Eloquent computed/accessor contract. */
export interface ParsedAccessor {
  readonly name: string;
  readonly propertyName: string;
  readonly semanticType: SemanticType;
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
    return ELOQUENT_RELATION_REGISTRY[type].isCollection;
  }

  public static isPolymorphic(type: EloquentRelationType): boolean {
    return ELOQUENT_RELATION_REGISTRY[type].isPolymorphic;
  }
}

/**
 * First-Class Eloquent Model Relationship Definition (Ordered & Complete Contract).
 */
export type RelationForeignKey =
  | { readonly kind: 'explicit'; readonly column: string }
  | { readonly kind: 'convention' };

export interface ParsedRelation {
  readonly name: string;
  readonly type: EloquentRelationType;
  readonly targetModel: string;
  readonly cardinality: EloquentRelationCardinality;
  readonly foreignKey: RelationForeignKey;
}

export interface SingleRelationDescriptor extends ParsedRelation {
  readonly cardinality: 'one';
}

export interface CollectionRelationDescriptor extends ParsedRelation {
  readonly cardinality: 'many';
}

export type RelationCardinalityDescriptor =
  | SingleRelationDescriptor
  | CollectionRelationDescriptor;

export type RelationCardinalityVisitor<R> = {
  readonly one: (relation: SingleRelationDescriptor) => R;
  readonly many: (relation: CollectionRelationDescriptor) => R;
};

export function matchRelationCardinality<R>(
  relation: RelationCardinalityDescriptor,
  visitor: RelationCardinalityVisitor<R>
): R {
  switch (relation.cardinality) {
    case 'one':
      return visitor.one(relation);
    case 'many':
      return visitor.many(relation);
  }
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
  switch (type) {
    case ModelKeyType.Int: return visitor.int(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Int]);
    case ModelKeyType.BigInt: return visitor.bigint(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.BigInt]);
    case ModelKeyType.String: return visitor.string(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.String]);
    case ModelKeyType.Uuid: return visitor.uuid(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Uuid]);
    case ModelKeyType.Ulid: return visitor.ulid(MODEL_KEY_TYPE_REGISTRY[ModelKeyType.Ulid]);
  }
}

/**
 * ModelKeyTypeMapper
 *
 * O(1) canonical dictionary normalization for model primary key types.
 */
export class ModelKeyTypeMapper {
  private static readonly NORMALIZATION_MAP: ReadonlyMap<string, ModelKeyType> = new Map([
    ['int', ModelKeyType.Int],
    ['integer', ModelKeyType.Int],
    ['bigint', ModelKeyType.BigInt],
    ['string', ModelKeyType.String],
    ['uuid', ModelKeyType.Uuid],
    ['ulid', ModelKeyType.Ulid]
  ]);

  public static normalize(rawKeyType: string): ModelKeyType {
    const normalized = this.NORMALIZATION_MAP.get(rawKeyType.toLowerCase());
    if (normalized === undefined) {
      throw new Error(`Model boundary violation: unsupported Eloquent $keyType "${rawKeyType}".`);
    }
    return normalized;
  }
}
