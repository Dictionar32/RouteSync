import type { ResponseBody } from "../../compiler/ir/ResponseArtifact";
import { toPascalCase } from "../../utils/resource-naming";
import type { EloquentRelationCardinality } from "./database";
import type { ResourceFieldDescriptor } from "./expressions";
import { SdkResponseKind } from "./lifecycle";

export const ResponseShape = Object.freeze({
  Paginated: 'paginated',
  Collection: 'collection',
  Single: 'single'
} as const);

export type ResponseShape = typeof ResponseShape[keyof typeof ResponseShape];

export interface ResponseShapeSpecification<S extends ResponseShape = ResponseShape> {
  readonly shape: S;
  readonly isCollection: boolean;
  readonly isPaginated: boolean;
  readonly isSingle: boolean;
  readonly defaultWrapperKey: string | null;
  readonly description: string;
}

export type ResponseShapeRegistry = {
  readonly [K in ResponseShape]: ResponseShapeSpecification<K>;
};

export const RESPONSE_SHAPE_REGISTRY: ResponseShapeRegistry = Object.freeze({
  [ResponseShape.Paginated]: {
    shape: ResponseShape.Paginated,
    isCollection: true,
    isPaginated: true,
    isSingle: false,
    defaultWrapperKey: 'data',
    description: 'Paginated envelope containing a collection of records with pagination metadata'
  },
  [ResponseShape.Collection]: {
    shape: ResponseShape.Collection,
    isCollection: true,
    isPaginated: false,
    isSingle: false,
    defaultWrapperKey: 'data',
    description: 'Direct array or collection of records'
  },
  [ResponseShape.Single]: {
    shape: ResponseShape.Single,
    isCollection: false,
    isPaginated: false,
    isSingle: true,
    defaultWrapperKey: null,
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
  const spec = RESPONSE_SHAPE_REGISTRY[shape];
  return visitor[shape](spec as any);
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
  readonly dataKey: string;     // 'data'
  readonly metaKey: string;     // 'meta'
  readonly linksKey: string | null;   // 'links' | null
  readonly envelopeTypeName: string; // e.g. 'PaginatedResponse<T>'
}

export interface LengthAwarePaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {
  readonly kind: 'length_aware';
  readonly linksKey: string;
}

export interface CursorPaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {
  readonly kind: 'cursor';
  readonly linksKey: null;
}

export type AnyPaginatedEnvelopeDescriptor =
  | LengthAwarePaginatedEnvelopeDescriptor
  | CursorPaginatedEnvelopeDescriptor;

export interface PaginatedEnvelopeDescriptor extends BasePaginatedEnvelopeDescriptor {}

export interface PaginationKindSpecification<K extends PaginationKind = PaginationKind> {
  readonly kind: K;
  readonly defaultDataKey: string;
  readonly defaultMetaKey: string;
  readonly defaultLinksKey: string | null;
  readonly defaultEnvelopeTypeName: string;
  readonly hasPageLinks: boolean;
  readonly isCursorBased: boolean;
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
    defaultDataKey: 'data',
    defaultMetaKey: 'meta',
    defaultLinksKey: 'links',
    defaultEnvelopeTypeName: 'PaginatedResponse<T>',
    hasPageLinks: true,
    isCursorBased: false
  }),
  [PaginationKind.Cursor]: Object.freeze({
    kind: PaginationKind.Cursor,
    defaultDataKey: 'data',
    defaultMetaKey: 'meta',
    defaultLinksKey: null,
    defaultEnvelopeTypeName: 'CursorPaginatedResponse<T>',
    hasPageLinks: false,
    isCursorBased: true
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
  envelope: PaginatedEnvelopeDescriptor,
  visitor: PaginatedEnvelopeVisitor<R>
): R {
  return visitor[envelope.kind](envelope as any);
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
  readonly idColumn: string;          // 'commentable_id'
  readonly typeColumn: string;        // 'commentable_type'
  readonly targetModels: readonly string[]; // ['Post', 'Video']
  readonly unionTypeName: string;     // 'CommentableTarget'
  readonly isCollection: boolean;
  readonly cardinality: EloquentRelationCardinality;
}

export interface MorphToRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphTo'> {
  readonly morphType: 'morphTo';
  readonly isCollection: false;
  readonly cardinality: 'one';
}

export interface MorphOneRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphOne'> {
  readonly morphType: 'morphOne';
  readonly isCollection: false;
  readonly cardinality: 'one';
}

export interface MorphManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphMany'> {
  readonly morphType: 'morphMany';
  readonly isCollection: true;
  readonly cardinality: 'many';
}

export interface MorphToManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphToMany'> {
  readonly morphType: 'morphToMany';
  readonly isCollection: true;
  readonly cardinality: 'many';
}

export interface MorphedByManyRelationDescriptor extends BasePolymorphicRelationDescriptor<'morphedByMany'> {
  readonly morphType: 'morphedByMany';
  readonly isCollection: true;
  readonly cardinality: 'many';
}

export type PolymorphicRelationDescriptor<T extends PolymorphicMorphType = PolymorphicMorphType> =
  T extends 'morphTo' ? MorphToRelationDescriptor :
  T extends 'morphOne' ? MorphOneRelationDescriptor :
  T extends 'morphMany' ? MorphManyRelationDescriptor :
  T extends 'morphToMany' ? MorphToManyRelationDescriptor :
  T extends 'morphedByMany' ? MorphedByManyRelationDescriptor :
  BasePolymorphicRelationDescriptor<T>;

export type AnyPolymorphicRelationDescriptor =
  | MorphToRelationDescriptor
  | MorphOneRelationDescriptor
  | MorphManyRelationDescriptor
  | MorphToManyRelationDescriptor
  | MorphedByManyRelationDescriptor;

export interface PolymorphicRelationSpecification<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly cardinality: EloquentRelationCardinality;
  readonly isCollection: boolean;
  readonly defaultIdColumn: string;
  readonly defaultTypeColumn: string;
  readonly defaultUnionTypeName: string;
}

export type PolymorphicRelationRegistry = {
  readonly [K in PolymorphicMorphType]: PolymorphicRelationSpecification<K>;
};

export const POLYMORPHIC_RELATION_REGISTRY: PolymorphicRelationRegistry = Object.freeze({
  [PolymorphicMorphType.MorphTo]: {
    morphType: PolymorphicMorphType.MorphTo,
    cardinality: 'one',
    isCollection: false,
    defaultIdColumn: 'commentable_id',
    defaultTypeColumn: 'commentable_type',
    defaultUnionTypeName: 'CommentableTarget'
  },
  [PolymorphicMorphType.MorphOne]: {
    morphType: PolymorphicMorphType.MorphOne,
    cardinality: 'one',
    isCollection: false,
    defaultIdColumn: 'commentable_id',
    defaultTypeColumn: 'commentable_type',
    defaultUnionTypeName: 'CommentableTarget'
  },
  [PolymorphicMorphType.MorphMany]: {
    morphType: PolymorphicMorphType.MorphMany,
    cardinality: 'many',
    isCollection: true,
    defaultIdColumn: 'commentable_id',
    defaultTypeColumn: 'commentable_type',
    defaultUnionTypeName: 'CommentableTarget'
  },
  [PolymorphicMorphType.MorphToMany]: {
    morphType: PolymorphicMorphType.MorphToMany,
    cardinality: 'many',
    isCollection: true,
    defaultIdColumn: 'taggable_id',
    defaultTypeColumn: 'taggable_type',
    defaultUnionTypeName: 'TaggableTarget'
  },
  [PolymorphicMorphType.MorphedByMany]: {
    morphType: PolymorphicMorphType.MorphedByMany,
    cardinality: 'many',
    isCollection: true,
    defaultIdColumn: 'taggable_id',
    defaultTypeColumn: 'taggable_type',
    defaultUnionTypeName: 'TaggableTarget'
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
  return visitor[relation.morphType](relation as any);
}

export const matchPolymorphicMorphType = matchPolymorphicRelation;


export interface ScannedPaginatedEnvelopeParams {
  readonly kind: PaginationKind;
  readonly dataKey: string;
  readonly metaKey: string;
  readonly linksKey: string | null;
  readonly envelopeTypeName: string;
}

/**
 * Reusable Constructor: Scanned Paginated Envelope Descriptor.
 */
export class ScannedPaginatedEnvelopeDescriptor implements PaginatedEnvelopeDescriptor {
  public readonly kind: PaginationKind;
  public readonly dataKey: string;
  public readonly metaKey: string;
  public readonly linksKey: string | null;
  public readonly envelopeTypeName: string;

  constructor(params: ScannedPaginatedEnvelopeParams) {
    this.kind = params.kind;
    this.dataKey = params.dataKey;
    this.metaKey = params.metaKey;
    this.linksKey = params.linksKey;
    this.envelopeTypeName = params.envelopeTypeName;
    Object.freeze(this);
  }

  public static create({
    kind = PaginationKind.LengthAware,
    dataKey,
    metaKey,
    linksKey,
    envelopeTypeName
  }: {
    readonly kind?: PaginationKind;
    readonly dataKey?: string;
    readonly metaKey?: string;
    readonly linksKey?: string | null;
    readonly envelopeTypeName?: string;
  } = {}): PaginatedEnvelopeDescriptor {
    const spec = PAGINATION_KIND_REGISTRY[kind];
    return new ScannedPaginatedEnvelopeDescriptor({
      kind,
      dataKey: dataKey ?? spec.defaultDataKey,
      metaKey: metaKey ?? spec.defaultMetaKey,
      linksKey: linksKey !== undefined ? linksKey : spec.defaultLinksKey,
      envelopeTypeName: envelopeTypeName ?? spec.defaultEnvelopeTypeName
    });
  }

  public static lengthAware(
    dataKey: string = 'data',
    linksKey: string = 'links',
    envelopeTypeName: string = 'PaginatedResponse<T>'
  ): LengthAwarePaginatedEnvelopeDescriptor {
    return new ScannedPaginatedEnvelopeDescriptor({
      kind: PaginationKind.LengthAware,
      dataKey,
      metaKey: 'meta',
      linksKey,
      envelopeTypeName
    }) as LengthAwarePaginatedEnvelopeDescriptor;
  }

  public static cursor(
    dataKey: string = 'data',
    envelopeTypeName: string = 'CursorPaginatedResponse<T>'
  ): CursorPaginatedEnvelopeDescriptor {
    return new ScannedPaginatedEnvelopeDescriptor({
      kind: PaginationKind.Cursor,
      dataKey,
      metaKey: 'meta',
      linksKey: null,
      envelopeTypeName
    }) as CursorPaginatedEnvelopeDescriptor;
  }
}

export interface ScannedPolymorphicRelationParams<T extends PolymorphicMorphType = PolymorphicMorphType> {
  readonly morphType: T;
  readonly idColumn: string;
  readonly typeColumn: string;
  readonly targetModels: readonly string[];
  readonly unionTypeName: string;
}

/**
 * Reusable Constructor: Scanned Polymorphic Relation Descriptor.
 */
export class ScannedPolymorphicRelationDescriptor implements BasePolymorphicRelationDescriptor {
  public readonly morphType: PolymorphicMorphType;
  public readonly idColumn: string;
  public readonly typeColumn: string;
  public readonly targetModels: readonly string[];
  public readonly unionTypeName: string;
  public readonly isCollection: boolean;
  public readonly cardinality: EloquentRelationCardinality;

  constructor(params: ScannedPolymorphicRelationParams) {
    this.morphType = params.morphType;
    this.idColumn = params.idColumn;
    this.typeColumn = params.typeColumn;
    this.targetModels = Object.freeze([...params.targetModels]);
    this.unionTypeName = params.unionTypeName;
    const spec = POLYMORPHIC_RELATION_REGISTRY[params.morphType];
    this.isCollection = spec.isCollection;
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
      idColumn: idColumn ?? spec.defaultIdColumn,
      typeColumn: typeColumn ?? spec.defaultTypeColumn,
      targetModels,
      unionTypeName: unionTypeName ?? spec.defaultUnionTypeName
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
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphToRelationDescriptor;
  }

  public static morphOne(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphOneRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphOne,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphOneRelationDescriptor;
  }

  public static morphMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'commentable_id',
    typeColumn: string = 'commentable_type',
    unionTypeName: string = 'CommentableTarget'
  ): MorphManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphMany,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphManyRelationDescriptor;
  }

  public static morphToMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'taggable_id',
    typeColumn: string = 'taggable_type',
    unionTypeName: string = 'TaggableTarget'
  ): MorphToManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphToMany,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphToManyRelationDescriptor;
  }

  public static morphedByMany(
    targetModels: readonly string[] = [],
    idColumn: string = 'taggable_id',
    typeColumn: string = 'taggable_type',
    unionTypeName: string = 'TaggableTarget'
  ): MorphedByManyRelationDescriptor {
    return new ScannedPolymorphicRelationDescriptor({
      morphType: PolymorphicMorphType.MorphedByMany,
      idColumn,
      typeColumn,
      targetModels,
      unionTypeName
    }) as unknown as MorphedByManyRelationDescriptor;
  }
}

export interface RouteResponseAnalysis {
  readonly routeName: string;
  readonly responseType: string;
  readonly shape: ResponseShape;
  readonly resourceName: string | null;
  readonly modelName: string | null;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

export abstract class ResponseDescriptorBase {
  abstract readonly kind: string;
  abstract readonly shape: ResponseShape;
  abstract readonly readTypeName: string; // ✅ Guaranteed Read Type Name ('UserResourceTransformed')
  abstract readonly mapperName: string;   // ✅ Guaranteed Mapper Function Name ('toUserResourceRead')
  abstract readonly validatorName: string; // ✅ Guaranteed Contract Validator Name ('validateUserResourceSchema')

  abstract toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis;
  abstract toResponseBody(): ResponseBody;
}

export interface ResourceResponseParams {
  readonly resourceName: string;
  readonly shape: ResponseShape;
}

export class ResourceResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'resource' as const;
  public readonly shape: ResponseShape;
  public readonly resourceName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;

  constructor(params: ResourceResponseParams) {
    super();
    this.resourceName = params.resourceName;
    this.shape = params.shape;
    this.readTypeName = `${params.resourceName}Transformed`;
    this.mapperName = `to${params.resourceName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.resourceName)}Index`
      : `validate${toPascalCase(params.resourceName)}Schema`;
    Object.freeze(this);
  }

  public static create({
    resourceName = 'UnknownResource',
    shape = 'single'
  }: {
    readonly resourceName?: string;
    readonly shape?: ResponseShape;
  } = {}): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape });
  }

  public static single(resourceName: string): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'single' });
  }

  public static collection(resourceName: string): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'collection' });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: this.resourceName,
      modelName: null,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'resource',
      resource: this.resourceName,
      shape: this.shape
    };
  }
}

export interface ModelResponseParams {
  readonly modelName: string;
  readonly shape: ResponseShape;
}

export class ModelResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'model' as const;
  public readonly shape: ResponseShape;
  public readonly modelName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;

  constructor(params: ModelResponseParams) {
    super();
    this.modelName = params.modelName;
    this.shape = params.shape;
    this.readTypeName = `${params.modelName}Transformed`;
    this.mapperName = `to${params.modelName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.modelName)}Index`
      : `validate${toPascalCase(params.modelName)}Schema`;
    Object.freeze(this);
  }

  public static create({
    modelName = 'UnknownModel',
    shape = 'single'
  }: {
    readonly modelName?: string;
    readonly shape?: ResponseShape;
  } = {}): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape });
  }

  public static single(modelName: string): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'single' });
  }

  public static collection(modelName: string): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'collection' });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: null,
      modelName: this.modelName,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'model',
      model: this.modelName,
      shape: this.shape
    };
  }
}

export class VoidResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'void' as const;
  public readonly shape = 'single' as const;
  public readonly readTypeName = 'void';
  public readonly mapperName = 'identity';
  public readonly validatorName = 'undefined';

  constructor() {
    super();
    Object.freeze(this);
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: null,
      modelName: null,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'primitive',
      primitiveType: 'void',
      shape: 'single'
    };
  }
}

export interface InlineResponseDescriptorParams {
  readonly domain: string;
  readonly baseName: string;
  readonly typeName: string;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly shape: ResponseShape;
}

export class InlineResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'inline' as const;
  public readonly shape: ResponseShape;
  public readonly domain: string;
  public readonly baseName: string;
  public readonly typeName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;
  public readonly fields: readonly ResourceFieldDescriptor[];

  constructor(params: InlineResponseDescriptorParams) {
    super();
    this.domain = params.domain;
    this.baseName = params.baseName;
    this.typeName = params.typeName;
    this.readTypeName = params.typeName;
    this.mapperName = `to${params.baseName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.baseName)}Index`
      : `validate${toPascalCase(params.baseName)}Schema`;
    this.fields = Object.freeze([...params.fields]);
    this.shape = params.shape;
    Object.freeze(this);
  }

  public static create({
    domain,
    baseName = domain,
    typeName = `${baseName}Transformed`,
    fields,
    shape = ResponseShape.Single
  }: {
    readonly domain: string;
    readonly baseName?: string;
    readonly typeName?: string;
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly shape?: ResponseShape;
  }): InlineResponseDescriptor {
    return new InlineResponseDescriptor({
      domain,
      baseName,
      typeName,
      fields,
      shape
    });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.typeName,
      shape: this.shape,
      resourceName: null,
      modelName: null,
      confidence,
      reasons: [
        `Inline response with ${this.fields.length} fields`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    const properties: Record<string, { readonly typeName: string; readonly nullable: boolean }> = {};
    for (const f of this.fields) {
      properties[f.name] = { typeName: 'string', nullable: f.nullable };
    }
    return {
      type: 'object',
      schema: {
        properties
      },
      shape: this.shape
    };
  }
}

export const ResponseKind = Object.freeze({
  Resource: 'resource',
  Model: 'model',
  Inline: 'inline',
  Void: 'void'
} as const);

export type ResponseKind = typeof ResponseKind[keyof typeof ResponseKind];

export type ResponseDescriptor =
  | ResourceResponseDescriptor
  | ModelResponseDescriptor
  | InlineResponseDescriptor
  | VoidResponseDescriptor;

export interface ResponseKindSpecification<K extends ResponseKind = ResponseKind> {
  readonly kind: K;
  readonly hasSchema: boolean;
  readonly hasMapper: boolean;
  readonly defaultStatusCode: number;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key ResponseKind.
 */
export type ResponseDescriptorRegistry = {
  readonly [K in ResponseKind]: ResponseKindSpecification<K>;
};

export const RESPONSE_DESCRIPTOR_REGISTRY: ResponseDescriptorRegistry = Object.freeze({
  [ResponseKind.Resource]: {
    kind: ResponseKind.Resource,
    hasSchema: true,
    hasMapper: true,
    defaultStatusCode: 200,
  },
  [ResponseKind.Model]: {
    kind: ResponseKind.Model,
    hasSchema: true,
    hasMapper: false,
    defaultStatusCode: 200,
  },
  [ResponseKind.Inline]: {
    kind: ResponseKind.Inline,
    hasSchema: true,
    hasMapper: true,
    defaultStatusCode: 200,
  },
  [ResponseKind.Void]: {
    kind: ResponseKind.Void,
    hasSchema: false,
    hasMapper: false,
    defaultStatusCode: 204,
  },
});

export interface ResponseVisitor<R> {
  readonly resource: (desc: ResourceResponseDescriptor) => R;
  readonly model: (desc: ModelResponseDescriptor) => R;
  readonly inline: (desc: InlineResponseDescriptor) => R;
  readonly void: (desc: VoidResponseDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ResponseDescriptor dengan exhaustive type safety
 */
export function matchResponse<R>(
  descriptor: ResponseDescriptor,
  visitor: ResponseVisitor<R>
): R {
  return visitor[descriptor.kind](descriptor as any);
}


export interface SdkResponseResolution {
  readonly kind: SdkResponseKind;
  readonly type: string;
  readonly hasSchema: boolean;
  readonly schemaExpression: string;
  readonly hasMapper: boolean;
  readonly mapperExpression: string;
}

export interface VoidSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'void';
  readonly type: 'void';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface RawSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'raw';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface ValidatedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'validated';
  readonly hasSchema: true;
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface MappedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'mapped';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: true;
}

export interface ValidatedAndMappedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'validated_and_mapped';
  readonly hasSchema: true;
  readonly hasMapper: true;
}

export type AnySdkResponseResolution =
  | VoidSdkResponseResolution
  | RawSdkResponseResolution
  | ValidatedSdkResponseResolution
  | MappedSdkResponseResolution
  | ValidatedAndMappedSdkResponseResolution;

export interface SdkResponseKindSpecification<K extends SdkResponseKind = SdkResponseKind> {
  readonly kind: K;
  readonly hasSchema: boolean;
  readonly hasMapper: boolean;
  readonly isTransformed: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key SdkResponseKind.
 */
export type SdkResponseKindRegistry = {
  readonly [K in SdkResponseKind]: SdkResponseKindSpecification<K>;
};

export const SDK_RESPONSE_KIND_REGISTRY: SdkResponseKindRegistry = Object.freeze({
  [SdkResponseKind.Void]: {
    kind: SdkResponseKind.Void,
    hasSchema: false,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Raw]: {
    kind: SdkResponseKind.Raw,
    hasSchema: false,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Validated]: {
    kind: SdkResponseKind.Validated,
    hasSchema: true,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Mapped]: {
    kind: SdkResponseKind.Mapped,
    hasSchema: false,
    hasMapper: true,
    isTransformed: true
  },
  [SdkResponseKind.ValidatedAndMapped]: {
    kind: SdkResponseKind.ValidatedAndMapped,
    hasSchema: true,
    hasMapper: true,
    isTransformed: true
  }
});

export interface SdkResponseResolutionVisitor<R> {
  readonly void: (res: VoidSdkResponseResolution) => R;
  readonly raw: (res: RawSdkResponseResolution) => R;
  readonly validated: (res: ValidatedSdkResponseResolution) => R;
  readonly mapped: (res: MappedSdkResponseResolution) => R;
  readonly validated_and_mapped: (res: ValidatedAndMappedSdkResponseResolution) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian SdkResponseResolution dengan exhaustive type safety
 */
export function matchSdkResponseResolution<R>(
  resolution: SdkResponseResolution,
  visitor: SdkResponseResolutionVisitor<R>
): R {
  return visitor[resolution.kind](resolution as any);
}

export const matchSdkResponse = matchSdkResponseResolution;

export class ScannedSdkResponseResolution implements SdkResponseResolution {
  public readonly kind: SdkResponseKind;
  public readonly type: string;
  public readonly hasSchema: boolean;
  public readonly schemaExpression: string;
  public readonly hasMapper: boolean;
  public readonly mapperExpression: string;

  constructor({
    kind,
    type,
    hasSchema,
    schemaExpression,
    hasMapper,
    mapperExpression
  }: {
    readonly kind: SdkResponseKind;
    readonly type: string;
    readonly hasSchema: boolean;
    readonly schemaExpression: string;
    readonly hasMapper: boolean;
    readonly mapperExpression: string;
  }) {
    this.kind = kind;
    this.type = type;
    this.hasSchema = hasSchema;
    this.schemaExpression = schemaExpression;
    this.hasMapper = hasMapper;
    this.mapperExpression = mapperExpression;
    Object.freeze(this);
  }

  public static voidResponse(): VoidSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Void,
      type: 'void',
      hasSchema: false,
      schemaExpression: '',
      hasMapper: false,
      mapperExpression: ''
    }) as VoidSdkResponseResolution;
  }

  public static raw(readTypeName: string): RawSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Raw,
      type: readTypeName,
      hasSchema: false,
      schemaExpression: '',
      hasMapper: false,
      mapperExpression: ''
    }) as RawSdkResponseResolution;
  }

  public static validated(readTypeName: string, schemaExpression: string): ValidatedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Validated,
      type: readTypeName,
      hasSchema: true,
      schemaExpression,
      hasMapper: false,
      mapperExpression: ''
    }) as ValidatedSdkResponseResolution;
  }

  public static mapped(readTypeName: string, mapperExpression: string): MappedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Mapped,
      type: readTypeName,
      hasSchema: false,
      schemaExpression: '',
      hasMapper: true,
      mapperExpression
    }) as MappedSdkResponseResolution;
  }

  public static validatedAndMapped(
    readTypeName: string,
    schemaExpression: string,
    mapperExpression: string
  ): ValidatedAndMappedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.ValidatedAndMapped,
      type: readTypeName,
      hasSchema: true,
      schemaExpression,
      hasMapper: true,
      mapperExpression
    }) as ValidatedAndMappedSdkResponseResolution;
  }
}


export type ResponseMetadata = ResponseDescriptor;
