import type { SemanticType } from "../../compiler/types/SemanticType";
import { PrimitiveKind, PrimitiveType, ReadonlyCollectionType, CollectionKind, JsonValueType, ReferenceType, primitiveType } from "../../compiler/types/SemanticType";
import { SemanticValueFactory, type ClassName, type ColumnName, type ModelName, type PropertyName, type CastTypeName, type SemanticOperator } from './semanticValues';
import type { Cardinality } from '../upstream/primitiveVocabulary';
import type { ModelAccessorFact, ModelCastFact } from '../upstream/modelSourceFacts';
import type { ModelSemanticRelation } from '../upstream/model';
import { relationEqual } from '../../semantic/foundation/semanticRelations';
import { relationGate, relationOptionFold, relationSome, relationRefine, relationResolve } from '../../semantic/foundation/relationalSequence';

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

  public static map(rawTargetType: string): { readonly castKind: EloquentCastKind; readonly valueType: EloquentCastValueType } {
    return this.resolve(rawTargetType);
  }

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

/** Canonical scanner fact for an Eloquent cast. */
export type { ModelCastFact };

/** Canonical scanner fact for an Eloquent accessor. */
export type { ModelAccessorFact };

/** Canonical Eloquent relation vocabulary is owned by the upstream semantic model. */
export type {
  EloquentRelationType,
  EloquentRelationCardinality,
  EloquentRelationDescriptor,
  EloquentRelationMultiplicity,
  RelationForeignKey,
} from '../upstream/modelVocabulary';

/** Canonical semantic relation is the sole relationship descriptor vocabulary. */
export type { ModelSemanticRelation };
export type SingleRelationDescriptor = ModelSemanticRelation & { readonly cardinality: Extract<ModelSemanticRelation['cardinality'], { readonly kind: 'one' }> };
export type CollectionRelationDescriptor = ModelSemanticRelation & { readonly cardinality: Extract<ModelSemanticRelation['cardinality'], { readonly kind: 'many' }> };
export type RelationCardinalityDescriptor = SingleRelationDescriptor | CollectionRelationDescriptor;

export type RelationCardinalityVisitor<R> = {
  readonly one: (relation: SingleRelationDescriptor) => R;
  readonly many: (relation: CollectionRelationDescriptor) => R;
};

const isSingleRelationDescriptor = (relation: RelationCardinalityDescriptor): relation is SingleRelationDescriptor =>
  relationEqual(relation.cardinality.kind, 'one');

const isCollectionRelationDescriptor = (relation: RelationCardinalityDescriptor): relation is CollectionRelationDescriptor =>
  relationEqual(relation.cardinality.kind, 'many');

const requireCollectionRelation = (relation: RelationCardinalityDescriptor): CollectionRelationDescriptor =>
  relationOptionFold(
    relationRefine(relation, isCollectionRelationDescriptor),
    () => { throw Error('Relation cardinality witness is not collection'); },
    collection => collection,
  );

export function matchRelationCardinality<R>(
  relation: RelationCardinalityDescriptor,
  visitor: RelationCardinalityVisitor<R>,
): R {
  return relationOptionFold(
    relationRefine(relation, isSingleRelationDescriptor),
    () => visitor.many(requireCollectionRelation(relation)),
    single => visitor.one(single),
  );
}

export const matchRelation = matchRelationCardinality;

export interface EloquentRelationTypeVisitor<R> {
  readonly hasOne: (rel: ModelSemanticRelation) => R;
  readonly hasMany: (rel: ModelSemanticRelation) => R;
  readonly belongsTo: (rel: ModelSemanticRelation) => R;
  readonly belongsToMany: (rel: ModelSemanticRelation) => R;
  readonly hasOneThrough: (rel: ModelSemanticRelation) => R;
  readonly hasManyThrough: (rel: ModelSemanticRelation) => R;
  readonly morphTo: (rel: ModelSemanticRelation) => R;
  readonly morphOne: (rel: ModelSemanticRelation) => R;
  readonly morphMany: (rel: ModelSemanticRelation) => R;
  readonly morphToMany: (rel: ModelSemanticRelation) => R;
  readonly morphedByMany: (rel: ModelSemanticRelation) => R;
}

/** Relation dispatch over the canonical semantic relation ADT. */
export function matchRelationType<R>(
  relation: ModelSemanticRelation,
  visitor: EloquentRelationTypeVisitor<R>,
): R {
  const kind = relation.eloquentType.kind;
  return relationResolve(
    relationEqual(kind, 'has_one'), () => visitor.hasOne(relation),
    () => relationResolve(relationEqual(kind, 'has_many'), () => visitor.hasMany(relation),
      () => relationResolve(relationEqual(kind, 'belongs_to'), () => visitor.belongsTo(relation),
        () => relationResolve(relationEqual(kind, 'belongs_to_many'), () => visitor.belongsToMany(relation),
          () => relationResolve(relationEqual(kind, 'has_one_through'), () => visitor.hasOneThrough(relation),
            () => relationResolve(relationEqual(kind, 'has_many_through'), () => visitor.hasManyThrough(relation),
              () => relationResolve(relationEqual(kind, 'morph_to'), () => visitor.morphTo(relation),
                () => relationResolve(relationEqual(kind, 'morph_one'), () => visitor.morphOne(relation),
                  () => relationResolve(relationEqual(kind, 'morph_many'), () => visitor.morphMany(relation),
                    () => relationResolve(relationEqual(kind, 'morph_to_many'), () => visitor.morphToMany(relation),
                      () => visitor.morphedByMany(relation),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
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
