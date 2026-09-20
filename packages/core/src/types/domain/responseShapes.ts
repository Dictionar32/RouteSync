import type {
  EloquentRelationCardinality,
  EloquentRelationType
} from "./database";
import {
  SemanticValueFactory
} from "./semanticValues";
import type {
  ColumnName,
  EnvelopeTypeName,
  ModelName,
  RelationName,
  ResponseDataKey,
  ResponseLinksKey,
  ResponseMetaKey,
  ResponseWrapperKey,
  ResponseLinksKeySpecification
} from "./semanticValues";

export const ResponseShape = Object.freeze({
  Paginated: 'paginated',
  Collection: 'collection',
  Single: 'single'
} as const);

export type ResponseShape = typeof ResponseShape[keyof typeof ResponseShape];

export interface ResponseShapeSpecification<S extends ResponseShape = ResponseShape> {
  readonly shape: S;
  readonly cardinality: EloquentRelationCardinality;
  readonly pagination: ResponsePaginationKind;
  readonly defaultWrapperKey: ResponseWrapperKey;
  readonly description: string;
}

export type ResponsePaginationKind = 'none' | 'paginated';

export type ResponseShapeRegistry = {
  readonly [K in ResponseShape]: ResponseShapeSpecification<K>;
};

export const RESPONSE_SHAPE_REGISTRY: ResponseShapeRegistry = Object.freeze({
  [ResponseShape.Paginated]: {
    shape: ResponseShape.Paginated,
    cardinality: 'many',
    pagination: 'paginated',
    defaultWrapperKey: { kind: 'data_wrapper', key: SemanticValueFactory.responseDataKey('data') },
    description: 'Paginated envelope containing a collection of records with pagination metadata'
  },
  [ResponseShape.Collection]: {
    shape: ResponseShape.Collection,
    cardinality: 'many',
    pagination: 'none',
    defaultWrapperKey: { kind: 'data_wrapper', key: SemanticValueFactory.responseDataKey('data') },
    description: 'Direct array or collection of records'
  },
  [ResponseShape.Single]: {
    shape: ResponseShape.Single,
    cardinality: 'one',
    pagination: 'none',
    defaultWrapperKey: { kind: 'no_wrapper' },
    description: 'Single item or record object'
  }
});

export type ResponseShapeVisitor<R> = {
  readonly paginated: (spec: ResponseShapeSpecification<'paginated'>) => R;
  readonly collection: (spec: ResponseShapeSpecification<'collection'>) => R;
  readonly single: (spec: ResponseShapeSpecification<'single'>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik ResponseShape dengan exhaustive type safety
 */
export function matchResponseShape<R>(
  shapeOrDescriptor: ResponseShape | { readonly shape: ResponseShape },
  visitor: ResponseShapeVisitor<R>
): R {
  const shape = typeof shapeOrDescriptor === 'string' ? shapeOrDescriptor : shapeOrDescriptor.shape;
  switch (shape) {
    case ResponseShape.Paginated:
      return visitor.paginated(RESPONSE_SHAPE_REGISTRY[ResponseShape.Paginated]);
    case ResponseShape.Collection:
      return visitor.collection(RESPONSE_SHAPE_REGISTRY[ResponseShape.Collection]);
    case ResponseShape.Single:
      return visitor.single(RESPONSE_SHAPE_REGISTRY[ResponseShape.Single]);
  }
}


/**
 * PaginationKind
 *
 * Canonical Domain Vocabulary for Laravel Pagination Envelopes.
 */
export const PaginationKind = Object.freeze({
  LengthAware: 'length_aware',
  Cursor: 'cursor'
} as const);

export type PaginationKind = typeof PaginationKind[keyof typeof PaginationKind];

/**
 * PaginatedEnvelopeDescriptor
 *
 * Explicit Domain Model for Laravel Pagination JSON Envelope.
 */
export interface BasePaginatedEnvelopeDescriptor {
  readonly kind: PaginationKind;
  readonly dataKey: ResponseDataKey;
  readonly metaKey: ResponseMetaKey;
  readonly linksKey: ResponseLinksKeySpecification;
  readonly envelopeTypeName: EnvelopeTypeName;
}

export interface LengthAwarePaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {
  readonly kind: 'length_aware';
  readonly linksKey: ResponseLinksKeySpecification;
}

export interface CursorPaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {
  readonly kind: 'cursor';
  readonly linksKey: ResponseLinksKeySpecification;
}

export type AnyPaginatedEnvelopeDescriptor =
  | LengthAwarePaginatedEnvelopeDescriptor
  | CursorPaginatedEnvelopeDescriptor;

export interface PaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {}

export interface PaginationKindSpecification<K extends PaginationKind = PaginationKind> {
  readonly kind: K;
  readonly defaultDataKey: ResponseDataKey;
  readonly defaultMetaKey: ResponseMetaKey;
  readonly defaultLinksKey: ResponseLinksKeySpecification;
  readonly defaultEnvelopeTypeName: EnvelopeTypeName;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key PaginationKind.
 */
export type PaginationKindRegistry = {
  readonly [K in PaginationKind]: PaginationKindSpecification<K>;
};

export const PAGINATION_KIND_REGISTRY: PaginationKindRegistry = Object.freeze({
  [PaginationKind.LengthAware]: Object.freeze({
    kind: PaginationKind.LengthAware,
    defaultDataKey: SemanticValueFactory.responseDataKey('data'),
    defaultMetaKey: SemanticValueFactory.responseMetaKey('meta'),
    defaultLinksKey: { kind: 'links_key' as const, key: SemanticValueFactory.responseLinksKey('links') },
    defaultEnvelopeTypeName: SemanticValueFactory.envelopeTypeName('PaginatedResponse<T>')
  }),
  [PaginationKind.Cursor]: Object.freeze({
    kind: PaginationKind.Cursor,
    defaultDataKey: SemanticValueFactory.responseDataKey('data'),
    defaultMetaKey: SemanticValueFactory.responseMetaKey('meta'),
    defaultLinksKey: { kind: 'no_links_key' as const },
    defaultEnvelopeTypeName: SemanticValueFactory.envelopeTypeName('CursorPaginatedResponse<T>')
  })
});

export interface PaginatedEnvelopeVisitor<R> {
  readonly length_aware: (desc: LengthAwarePaginatedEnvelopeDescriptor) => R;
  readonly cursor: (desc: CursorPaginatedEnvelopeDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik tipe PaginatedEnvelopeDescriptor dengan exhaustive type safety
 */
export function matchPaginatedEnvelope<R>(
  envelope: AnyPaginatedEnvelopeDescriptor,
  visitor: PaginatedEnvelopeVisitor<R>
): R {
  switch (envelope.kind) {
    case PaginationKind.LengthAware:
      return visitor.length_aware(envelope);
    case PaginationKind.Cursor:
      return visitor.cursor(envelope);
  }
}

export const matchPaginationKind = matchPaginatedEnvelope;

// ----------------------------------------------------------------------------
// 22. Polymorphic Relation ADT (MorphTo, MorphMany, MorphedByMany, etc.)
// ----------------------------------------------------------------------------

export const PolymorphicMorphType = Object.freeze({
  MorphTo: 'morphTo',
  MorphOne: 'morphOne',
  MorphMany: 'morphMany',
  MorphToMany: 'morphToMany',
  MorphedByMany: 'morphedByMany'
} as const);

export type PolymorphicMorphType = typeof PolymorphicMorphType[keyof typeof PolymorphicMorphType];

export interface BasePolymorphicRelationDescriptor<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly idColumn: ColumnName;
  readonly typeColumn: ColumnName;
  readonly targetModels: readonly ModelName[];
  readonly unionTypeName: EnvelopeTypeName;
  readonly cardinality: EloquentRelationCardinality;
}

export interface MorphToRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphTo'> {
  readonly morphType: 'morphTo';
  readonly cardinality: 'one';
}

export interface MorphOneRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphOne'> {
  readonly morphType: 'morphOne';
  readonly cardinality: 'one';
}

export interface MorphManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphMany'> {
  readonly morphType: 'morphMany';
  readonly cardinality: 'many';
}

export interface MorphToManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphToMany'> {
  readonly morphType: 'morphToMany';
  readonly cardinality: 'many';
}

export interface MorphedByManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphedByMany'> {
  readonly morphType: 'morphedByMany';
  readonly cardinality: 'many';
}

export type PolymorphicRelationDescriptor<T extends PolymorphicMorphType = PolymorphicMorphType> =
  Extract<AnyPolymorphicRelationDescriptor, { readonly morphType: T }>;

export type AnyPolymorphicRelationDescriptor =
  | MorphToRelationDescriptor
  | MorphOneRelationDescriptor
  | MorphManyRelationDescriptor
  | MorphToManyRelationDescriptor
  | MorphedByManyRelationDescriptor;

export interface PolymorphicRelationSpecification<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly cardinality: EloquentRelationCardinality;
  readonly defaultIdColumn: ColumnName;
  readonly defaultTypeColumn: ColumnName;
  readonly defaultUnionTypeName: EnvelopeTypeName;
}

export type PolymorphicRelationRegistry = {
  readonly [K in PolymorphicMorphType]: PolymorphicRelationSpecification<K>;
};

export const POLYMORPHIC_RELATION_REGISTRY: PolymorphicRelationRegistry = Object.freeze({
  [PolymorphicMorphType.MorphTo]: {
    morphType: PolymorphicMorphType.MorphTo,
    cardinality: 'one',
    defaultIdColumn: SemanticValueFactory.columnName('commentable_id'),
    defaultTypeColumn: SemanticValueFactory.columnName('commentable_type'),
    defaultUnionTypeName: SemanticValueFactory.envelopeTypeName('CommentableTarget')
  },
  [PolymorphicMorphType.MorphOne]: {
    morphType: PolymorphicMorphType.MorphOne,
    cardinality: 'one',
    defaultIdColumn: SemanticValueFactory.columnName('commentable_id'),
    defaultTypeColumn: SemanticValueFactory.columnName('commentable_type'),
    defaultUnionTypeName: SemanticValueFactory.envelopeTypeName('CommentableTarget')
  },
  [PolymorphicMorphType.MorphMany]: {
    morphType: PolymorphicMorphType.MorphMany,
    cardinality: 'many',
    defaultIdColumn: SemanticValueFactory.columnName('commentable_id'),
    defaultTypeColumn: SemanticValueFactory.columnName('commentable_type'),
    defaultUnionTypeName: SemanticValueFactory.envelopeTypeName('CommentableTarget')
  },
  [PolymorphicMorphType.MorphToMany]: {
    morphType: PolymorphicMorphType.MorphToMany,
    cardinality: 'many',
    defaultIdColumn: SemanticValueFactory.columnName('taggable_id'),
    defaultTypeColumn: SemanticValueFactory.columnName('taggable_type'),
    defaultUnionTypeName: SemanticValueFactory.envelopeTypeName('TaggableTarget')
  },
  [PolymorphicMorphType.MorphedByMany]: {
    morphType: PolymorphicMorphType.MorphedByMany,
    cardinality: 'many',
    defaultIdColumn: SemanticValueFactory.columnName('taggable_id'),
    defaultTypeColumn: SemanticValueFactory.columnName('taggable_type'),
    defaultUnionTypeName: SemanticValueFactory.envelopeTypeName('TaggableTarget')
  }
});

export type PolymorphicRelationVisitor<R> = {
  readonly [K in PolymorphicMorphType]: (relation: PolymorphicRelationDescriptor<K>) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian PolymorphicRelationDescriptor dengan exhaustive type safety
 */
export function matchPolymorphicRelation<R>(
  relation: PolymorphicRelationDescriptor,
  visitor: PolymorphicRelationVisitor<R>
): R {
  switch (relation.morphType) {
    case PolymorphicMorphType.MorphTo:
      return visitor.morphTo(relation);
    case PolymorphicMorphType.MorphOne:
      return visitor.morphOne(relation);
    case PolymorphicMorphType.MorphMany:
      return visitor.morphMany(relation);
    case PolymorphicMorphType.MorphToMany:
      return visitor.morphToMany(relation);
    case PolymorphicMorphType.MorphedByMany:
      return visitor.morphedByMany(relation);
  }
}

export const matchPolymorphicMorphType = matchPolymorphicRelation;


export interface ScannedPaginatedEnvelopeParams {
  readonly kind: PaginationKind;
  readonly dataKey: ResponseDataKey;
  readonly metaKey: ResponseMetaKey;
  readonly linksKey: ResponseLinksKeySpecification;
  readonly envelopeTypeName: EnvelopeTypeName;
}

/**
 * Reusable Constructor: Scanned Paginated Envelope Descriptor.
 */
export class ScannedPaginatedEnvelopeDescriptor<K extends PaginationKind = PaginationKind>
  implements BasePaginatedEnvelopeDescriptor {
  public readonly kind: K;
  public readonly dataKey: ResponseDataKey;
  public readonly metaKey: ResponseMetaKey;
  public readonly linksKey: ResponseLinksKeySpecification;
  public readonly envelopeTypeName: EnvelopeTypeName;

  constructor(params: ScannedPaginatedEnvelopeParams & { readonly kind: K }) {
    this.kind = params.kind;
    this.dataKey = params.dataKey;
    this.metaKey = params.metaKey;
    this.linksKey = params.linksKey;
    this.envelopeTypeName = params.envelopeTypeName;
    Object.freeze(this);
  }

  public static create<K extends PaginationKind = typeof PaginationKind.LengthAware>(
    params: {
      readonly kind: K;
      readonly dataKey?: ResponseDataKey;
      readonly metaKey?: ResponseMetaKey;
      readonly linksKey?: ResponseLinksKeySpecification;
      readonly envelopeTypeName?: EnvelopeTypeName;
    }
  ): ScannedPaginatedEnvelopeDescriptor<K>;
  public static create(): ScannedPaginatedEnvelopeDescriptor<'length_aware'>;
  public static create<K extends PaginationKind = typeof PaginationKind.LengthAware>(
    params: {
      readonly kind?: K;
      readonly dataKey?: ResponseDataKey;
      readonly metaKey?: ResponseMetaKey;
      readonly linksKey?: ResponseLinksKeySpecification;
      readonly envelopeTypeName?: EnvelopeTypeName;
    } = {}
  ): ScannedPaginatedEnvelopeDescriptor<K> {
    const kind = (params.kind ?? PaginationKind.LengthAware) as K;
    const spec = PAGINATION_KIND_REGISTRY[kind];
    return new ScannedPaginatedEnvelopeDescriptor({
      kind,
      dataKey: params.dataKey ?? spec.defaultDataKey,
      metaKey: params.metaKey ?? spec.defaultMetaKey,
      linksKey: params.linksKey ?? spec.defaultLinksKey,
      envelopeTypeName: params.envelopeTypeName ?? spec.defaultEnvelopeTypeName
    });
  }

  public static lengthAware(
    dataKey: string = 'data',
    linksKey: string = 'links',
    envelopeTypeName: string = 'PaginatedResponse<T>'
  ): ScannedPaginatedEnvelopeDescriptor<'length_aware'> {
    return new ScannedPaginatedEnvelopeDescriptor({
      kind: PaginationKind.LengthAware,
      dataKey: SemanticValueFactory.responseDataKey(dataKey),
      metaKey: SemanticValueFactory.responseMetaKey('meta'),
      linksKey: { kind: 'links_key', key: SemanticValueFactory.responseLinksKey(linksKey) },
      envelopeTypeName: SemanticValueFactory.envelopeTypeName(envelopeTypeName)
    });
  }

  public static cursor(
    dataKey: string = 'data',
    envelopeTypeName: string = 'CursorPaginatedResponse<T>'
  ): ScannedPaginatedEnvelopeDescriptor<'cursor'> {
    return new ScannedPaginatedEnvelopeDescriptor({
      kind: PaginationKind.Cursor,
      dataKey: SemanticValueFactory.responseDataKey(dataKey),
      metaKey: SemanticValueFactory.responseMetaKey('meta'),
      linksKey: { kind: 'no_links_key' },
      envelopeTypeName: SemanticValueFactory.envelopeTypeName(envelopeTypeName)
    });
  }
}

export interface ScannedPolymorphicRelationParams<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly idColumn: ColumnName;
  readonly typeColumn: ColumnName;
  readonly targetModels: readonly ModelName[];
  readonly unionTypeName: EnvelopeTypeName;
}

/**
 * Reusable Constructor: Scanned Polymorphic Relation Descriptor.
 */
export class ScannedPolymorphicRelationDescriptor implements BasePolymorphicRelationDescriptor {
  public readonly morphType: PolymorphicMorphType;
  public readonly idColumn: ColumnName;
  public readonly typeColumn: ColumnName;
  public readonly targetModels: readonly ModelName[];
  public readonly unionTypeName: EnvelopeTypeName;
  public readonly cardinality: EloquentRelationCardinality;

  constructor(params: ScannedPolymorphicRelationParams) {
    this.morphType = params.morphType;
    this.idColumn = params.idColumn;
    this.typeColumn = params.typeColumn;
    this.targetModels = Object.freeze([...params.targetModels]);
    this.unionTypeName = params.unionTypeName;
    const spec = POLYMORPHIC_RELATION_REGISTRY[params.morphType];
    this.cardinality = spec.cardinality;
    Object.freeze(this);
  }

  public static create({
    morphType = PolymorphicMorphType.MorphTo,
    idColumn,
    typeColumn,
    targetModels = [],
    unionTypeName
  }: {
    readonly morphType?: PolymorphicMorphType;
    readonly idColumn?: string;
    readonly typeColumn?: string;
    readonly targetModels?: readonly string[];
    readonly unionTypeName?: string;
  } = {}): ScannedPolymorphicRelationDescriptor {
    const effectiveType = morphType ?? PolymorphicMorphType.MorphTo;
    const spec = POLYMORPHIC_RELATION_REGISTRY[effectiveType];
    return new ScannedPolymorphicRelationDescriptor({
      morphType: effectiveType,
      idColumn: idColumn
        ? SemanticValueFactory.columnName(idColumn)
        : spec.defaultIdColumn,
      typeColumn: typeColumn
        ? SemanticValueFactory.columnName(typeColumn)
        : spec.defaultTypeColumn,
      targetModels: targetModels.map(SemanticValueFactory.modelName),
      unionTypeName: unionTypeName
        ? SemanticValueFactory.envelopeTypeName(unionTypeName)
        : spec.defaultUnionTypeName
    });
  }

  public static morphTo(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphToRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphTo,
      idColumn: SemanticValueFactory.columnName(idColumn),
      typeColumn: SemanticValueFactory.columnName(typeColumn),
      targetModels: targetModels.map(SemanticValueFactory.modelName),
      unionTypeName: SemanticValueFactory.envelopeTypeName(unionTypeName)
    }) as MorphToRelationDescriptor;
  }

  public static morphOne(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphOneRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphOne,
      idColumn: SemanticValueFactory.columnName(idColumn),
      typeColumn: SemanticValueFactory.columnName(typeColumn),
      targetModels: targetModels.map(SemanticValueFactory.modelName),
      unionTypeName: SemanticValueFactory.envelopeTypeName(unionTypeName)
    }) as MorphOneRelationDescriptor;
  }

  public static morphMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphMany,
      idColumn: SemanticValueFactory.columnName(idColumn),
      typeColumn: SemanticValueFactory.columnName(typeColumn),
      targetModels: targetModels.map(SemanticValueFactory.modelName),
      unionTypeName: SemanticValueFactory.envelopeTypeName(unionTypeName)
    }) as MorphManyRelationDescriptor;
  }

  public static morphToMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'taggable_id',
    typeColumn: string = 'taggable_type',
    unionTypeName: string = 'TaggableTarget'
  ): MorphToManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphToMany,
      idColumn: SemanticValueFactory.columnName(idColumn),
      typeColumn: SemanticValueFactory.columnName(typeColumn),
      targetModels: targetModels.map(SemanticValueFactory.modelName),
      unionTypeName: SemanticValueFactory.envelopeTypeName(unionTypeName)
    }) as MorphToManyRelationDescriptor;
  }

  public static morphedByMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'taggable_id',
    typeColumn: string = 'taggable_type',
    unionTypeName: string = 'TaggableTarget'
  ): MorphedByManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphedByMany,
      idColumn: SemanticValueFactory.columnName(idColumn),
      typeColumn: SemanticValueFactory.columnName(typeColumn),
      targetModels: targetModels.map(SemanticValueFactory.modelName),
      unionTypeName: SemanticValueFactory.envelopeTypeName(unionTypeName)
    }) as MorphedByManyRelationDescriptor;
  }
}
