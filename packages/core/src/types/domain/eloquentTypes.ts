import type { SemanticType } from "../../compiler/types/SemanticType";
import { PrimitiveKind, PrimitiveType, ReadonlyCollectionType, CollectionKind, JsonValueType, ReferenceType } from "../../compiler/types/SemanticType";
import { SemanticValueFactory, type ClassName, type ColumnName, type MethodName, type ModelName, type PropertyName, type RelationName, type CastTypeName, type SemanticOperator } from './semanticValues';
import type { Cardinality } from '../upstream/primitiveVocabulary';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import { relationGate, relationOptionFold, relationSome } from '../../semantic/kernel/relationalSequence';

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

export type EloquentCastValueType =
  | { readonly kind: 'primitive'; readonly type: PrimitiveKind; readonly semanticType: SemanticType }
  | { readonly kind: 'json'; readonly semanticType: SemanticType }
  | { readonly kind: 'collection'; readonly element: EloquentCastValueType; readonly semanticType: SemanticType }
  | { readonly kind: 'custom'; readonly className: ClassName; readonly semanticType: SemanticType };

export interface EloquentCastKindSpecification<K extends EloquentCastKind = EloquentCastKind> {
  readonly kind: K;
  readonly resolveValueType: (targetType: CastTypeName) => EloquentCastValueType;
}

export type EloquentCastKindRegistry = {
  readonly [K in EloquentCastKind]: EloquentCastKindSpecification<K>;
};

const primitiveValue = (type: PrimitiveKind): EloquentCastValueType => ({
  kind: 'primitive',
  type,
  semanticType: primitiveType(type),
});

const jsonValue = (): EloquentCastValueType => ({
  kind: 'json',
  semanticType: JsonValueType(),
});

const collectionValue = (): EloquentCastValueType => ({
  kind: 'collection',
  element: jsonValue(),
  semanticType: ReadonlyCollectionType(CollectionKind.COLLECTION, JsonValueType()),
});

export const ELOQUENT_CAST_REGISTRY: EloquentCastKindRegistry = Object.freeze({
  [EloquentCastKind.Integer]: { kind: EloquentCastKind.Integer, resolveValueType: () => primitiveValue(PrimitiveKind.NUMBER) },
  [EloquentCastKind.Float]: { kind: EloquentCastKind.Float, resolveValueType: () => primitiveValue(PrimitiveKind.NUMBER) },
  [EloquentCastKind.Decimal]: { kind: EloquentCastKind.Decimal, resolveValueType: () => primitiveValue(PrimitiveKind.NUMBER) },
  [EloquentCastKind.Boolean]: { kind: EloquentCastKind.Boolean, resolveValueType: () => primitiveValue(PrimitiveKind.BOOLEAN) },
  [EloquentCastKind.String]: { kind: EloquentCastKind.String, resolveValueType: () => primitiveValue(PrimitiveKind.STRING) },
  [EloquentCastKind.DateTime]: { kind: EloquentCastKind.DateTime, resolveValueType: () => primitiveValue(PrimitiveKind.DATETIME) },
  [EloquentCastKind.Date]: { kind: EloquentCastKind.Date, resolveValueType: () => primitiveValue(PrimitiveKind.DATETIME) },
  [EloquentCastKind.Timestamp]: { kind: EloquentCastKind.Timestamp, resolveValueType: () => primitiveValue(PrimitiveKind.DATETIME) },
  [EloquentCastKind.Array]: { kind: EloquentCastKind.Array, resolveValueType: () => jsonValue() },
  [EloquentCastKind.Json]: { kind: EloquentCastKind.Json, resolveValueType: () => jsonValue() },
  [EloquentCastKind.Object]: { kind: EloquentCastKind.Object, resolveValueType: () => jsonValue() },
  [EloquentCastKind.Collection]: { kind: EloquentCastKind.Collection, resolveValueType: () => collectionValue() },
  [EloquentCastKind.Encrypted]: { kind: EloquentCastKind.Encrypted, resolveValueType: () => primitiveValue(PrimitiveKind.STRING) },
  [EloquentCastKind.Custom]: {
    kind: EloquentCastKind.Custom,
    resolveValueType: (targetType: CastTypeName) => ({
      kind: 'custom' as const,
      className: SemanticValueFactory.className(targetType.value),
      semanticType: ReferenceType.model('', targetType.value)
    })
  },
});

export type EloquentCastKindVisitor<R> = {
  readonly [K in EloquentCastKind]: (spec: EloquentCastKindSpecification<K>) => R;
};

/** Canonical relational visitor for the Eloquent cast vocabulary. */
export function matchEloquentCastKind<R>(
  kind: EloquentCastKind,
  visitor: EloquentCastKindVisitor<R>
): R {
  const specs = Object.values(ELOQUENT_CAST_REGISTRY) as readonly EloquentCastKindSpecification[];
  const visit = (index: number): R => relationGate(
    relationEqual(index, specs.length),
    () => visitor.custom(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Custom]),
    () => relationGate(
      relationEqual(kind, specs[index].kind),
      () => relationGate(
        relationEqual(kind, EloquentCastKind.Integer),
        () => visitor.integer(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Integer]),
        () => relationGate(relationEqual(kind, EloquentCastKind.Float), () => visitor.float(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Float]), () => relationGate(
          relationEqual(kind, EloquentCastKind.Decimal), () => visitor.decimal(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Decimal]), () => relationGate(
            relationEqual(kind, EloquentCastKind.Boolean), () => visitor.boolean(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Boolean]), () => relationGate(
              relationEqual(kind, EloquentCastKind.String), () => visitor.string(ELOQUENT_CAST_REGISTRY[EloquentCastKind.String]), () => relationGate(
                relationEqual(kind, EloquentCastKind.DateTime), () => visitor.datetime(ELOQUENT_CAST_REGISTRY[EloquentCastKind.DateTime]), () => relationGate(
                  relationEqual(kind, EloquentCastKind.Date), () => visitor.date(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Date]), () => relationGate(
                    relationEqual(kind, EloquentCastKind.Timestamp), () => visitor.timestamp(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Timestamp]), () => relationGate(
                      relationEqual(kind, EloquentCastKind.Array), () => visitor.array(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Array]), () => relationGate(
                        relationEqual(kind, EloquentCastKind.Json), () => visitor.json(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Json]), () => relationGate(
                          relationEqual(kind, EloquentCastKind.Object), () => visitor.object(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Object]), () => relationGate(
                            relationEqual(kind, EloquentCastKind.Collection), () => visitor.collection(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Collection]), () => relationGate(
                              relationEqual(kind, EloquentCastKind.Encrypted), () => visitor.encrypted(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Encrypted]), () => visitor.custom(ELOQUENT_CAST_REGISTRY[EloquentCastKind.Custom])
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )),
      ),
      () => visit(index + 1),
    ),
  );
  return visit(0);
}

/** Canonical cast resolver driven by a relation lookup and explicit fallback witness. */
export class EloquentCastMapper {
  private static readonly CAST_MAP: ReadonlyMap<string, EloquentCastKind> = new Map([
    ['int', EloquentCastKind.Integer], ['integer', EloquentCastKind.Integer], ['real', EloquentCastKind.Float],
    ['float', EloquentCastKind.Float], ['double', EloquentCastKind.Float], ['decimal', EloquentCastKind.Decimal],
    ['string', EloquentCastKind.String], ['bool', EloquentCastKind.Boolean], ['boolean', EloquentCastKind.Boolean],
    ['object', EloquentCastKind.Object], ['array', EloquentCastKind.Array], ['json', EloquentCastKind.Json],
    ['collection', EloquentCastKind.Collection], ['date', EloquentCastKind.Date], ['datetime', EloquentCastKind.DateTime],
    ['custom_datetime', EloquentCastKind.DateTime], ['timestamp', EloquentCastKind.Timestamp], ['encrypted', EloquentCastKind.Encrypted],
    ['hashed', EloquentCastKind.String], ['asarrayobject', EloquentCastKind.Object], ['ascollection', EloquentCastKind.Collection],
    ['asenumcollection', EloquentCastKind.Collection], ['immutable_date', EloquentCastKind.Date], ['immutable_datetime', EloquentCastKind.DateTime]
  ]);

  public static resolve(rawTargetType: string): { readonly castKind: EloquentCastKind; readonly valueType: EloquentCastValueType } {
    const clean = rawTargetType.split(':')[0].replace(/^\s+|\s+$/g, '').toLowerCase();
    const targetType = SemanticValueFactory.castTypeName(rawTargetType);
    const mapped = relationGate(
      this.CAST_MAP.has(clean),
      () => relationOptionFold(relationSome(this.CAST_MAP.get(clean)!), () => EloquentCastKind.Custom, kind => kind),
      () => EloquentCastKind.Custom,
    );
    const spec = ELOQUENT_CAST_REGISTRY[mapped];
    return relationGate(
      relationEqual(mapped, EloquentCastKind.Custom),
      () => ({ castKind: spec.kind, valueType: spec.resolveValueType(targetType) }),
      () => ({ castKind: spec.kind, valueType: spec.resolveValueType(targetType) }),
    );
  }
}

/**
 * First-Class Eloquent Attribute Cast Entry (Ordered & Guaranteed Complete Model).
 */
export type EloquentCastTarget =
  | { readonly kind: 'builtin'; readonly castKind: EloquentCastKind }
  | { readonly kind: 'custom'; readonly className: ClassName };

/** First-class Eloquent attribute cast contract. */
export interface ParsedCast {
  readonly column: ColumnName;
  readonly target: EloquentCastTarget;
  readonly castKind: EloquentCastKind;
  readonly targetType: CastTypeName;
  readonly valueType: EloquentCastValueType;
}

/** First-class Eloquent computed/accessor contract. */
export type { ModelAccessorExpression, ModelAccessorMatchArm } from '../upstream/modelVocabulary';
export type ModelAccessorComputation =
  | { readonly kind: 'expression'; readonly expression: ModelAccessorExpression; readonly result: SemanticType }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'missing_return_expression'; readonly result: SemanticType };

export interface ParsedAccessor {
  readonly name: MethodName;
  readonly propertyName: PropertyName;
  readonly computation: ModelAccessorComputation;
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

export type EloquentRelationCardinality = Cardinality;

export type EloquentRelationPolymorphism =
  | { readonly kind: 'non_polymorphic' }
  | { readonly kind: 'polymorphic' };

export interface EloquentRelationDescriptor<T extends EloquentRelationType = EloquentRelationType> {
  readonly type: T;
  readonly cardinality: EloquentRelationCardinality;
  readonly polymorphism: EloquentRelationPolymorphism;
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
    cardinality: { kind: 'one' },
    polymorphism: { kind: 'non_polymorphic' }
  },
  [EloquentRelationType.HasMany]: {
    type: EloquentRelationType.HasMany,
    cardinality: { kind: 'many' },
    polymorphism: { kind: 'non_polymorphic' }
  },
  [EloquentRelationType.BelongsTo]: {
    type: EloquentRelationType.BelongsTo,
    cardinality: { kind: 'one' },
    polymorphism: { kind: 'non_polymorphic' }
  },
  [EloquentRelationType.BelongsToMany]: {
    type: EloquentRelationType.BelongsToMany,
    cardinality: { kind: 'many' },
    polymorphism: { kind: 'non_polymorphic' }
  },
  [EloquentRelationType.HasOneThrough]: {
    type: EloquentRelationType.HasOneThrough,
    cardinality: { kind: 'one' },
    polymorphism: { kind: 'non_polymorphic' }
  },
  [EloquentRelationType.HasManyThrough]: {
    type: EloquentRelationType.HasManyThrough,
    cardinality: { kind: 'many' },
    polymorphism: { kind: 'non_polymorphic' }
  },
  [EloquentRelationType.MorphTo]: {
    type: EloquentRelationType.MorphTo,
    cardinality: { kind: 'one' },
    polymorphism: { kind: 'polymorphic' }
  },
  [EloquentRelationType.MorphOne]: {
    type: EloquentRelationType.MorphOne,
    cardinality: { kind: 'one' },
    polymorphism: { kind: 'polymorphic' }
  },
  [EloquentRelationType.MorphMany]: {
    type: EloquentRelationType.MorphMany,
    cardinality: { kind: 'many' },
    polymorphism: { kind: 'polymorphic' }
  },
  [EloquentRelationType.MorphToMany]: {
    type: EloquentRelationType.MorphToMany,
    cardinality: { kind: 'many' },
    polymorphism: { kind: 'polymorphic' }
  },
  [EloquentRelationType.MorphedByMany]: {
    type: EloquentRelationType.MorphedByMany,
    cardinality: { kind: 'many' },
    polymorphism: { kind: 'polymorphic' }
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
    return ELOQUENT_RELATION_REGISTRY[type].cardinality.kind === 'many';
  }

  public static isPolymorphic(type: EloquentRelationType): boolean {
    return ELOQUENT_RELATION_REGISTRY[type].polymorphism.kind === 'polymorphic';
  }
}

/**
 * First-Class Eloquent Model Relationship Definition (Ordered & Complete Contract).
 */
export type RelationForeignKey =
  | { readonly kind: 'convention' }
  | { readonly kind: 'explicit'; readonly column: ColumnName };

export type RelationTargetShape =
  | { readonly kind: 'single'; readonly model: ModelName }
  | { readonly kind: 'collection'; readonly model: ModelName };

export interface ParsedRelation {
  readonly name: RelationName;
  readonly type: EloquentRelationType;
  readonly sourceModel: ModelName;
  readonly targetModel: ModelName;
  readonly cardinality: EloquentRelationCardinality;
  readonly multiplicity: { readonly kind: 'single' } | { readonly kind: 'collection' };
  /** Complete semantic value already resolved at the scanner boundary. */
  readonly semanticType: SemanticType;
  readonly targetShape: RelationTargetShape;
  readonly traversalTarget: { readonly kind: 'model'; readonly model: ModelName } | { readonly kind: 'collection'; readonly model: ModelName };
  readonly foreignKey: RelationForeignKey;
}

export interface SingleRelationDescriptor extends ParsedRelation {
  readonly cardinality: { readonly kind: 'one' };
}

export interface CollectionRelationDescriptor extends ParsedRelation {
  readonly cardinality: { readonly kind: 'many' };
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
