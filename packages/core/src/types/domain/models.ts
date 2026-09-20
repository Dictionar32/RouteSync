import type { ParsedColumn } from './databaseColumns';
import type { EloquentRelationType, RelationForeignKey, ModelAccessorComputation } from './eloquentTypes';
import type { ModelKeySemanticType, ModelKeyType } from './modelContracts';
import type { ColumnName, ModelName, PropertyName, RelationName, TableName } from './semanticValues';
import type { DatabaseColumnType, Nullability } from './modelContracts';
import type { MethodName } from './semanticValues';
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { Lookup } from '../upstream/collections';

export type ModelPropertyMultiplicity =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };

export type ModelPropertyTraversalMeaning =
  | { readonly kind: 'scalar'; readonly semanticType: SemanticType }
  | { readonly kind: 'relation'; readonly targetModel: ModelName; readonly cardinality: import('./eloquentTypes').EloquentRelationCardinality; readonly semanticType: SemanticType };

export type ModelSemanticProperty =
  | ModelSemanticColumn
  | ModelSemanticAccessor
  | ModelSemanticRelation;

export type ModelPropertyAccessFact =
  | { readonly kind: 'scalar'; readonly property: ModelSemanticColumn | ModelSemanticAccessor }
  | { readonly kind: 'relation'; readonly property: ModelSemanticRelation };

/** Fully classified model surface. Downstream consumes this, never raw scanner members. */
export interface ModelSemanticColumn {
  readonly kind: 'column';
  readonly property: PropertyName;
  readonly column: ColumnName;
  readonly databaseType: DatabaseColumnType;
  readonly semanticType: SemanticType;
  readonly nullability: Nullability;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'scalar' }>;
}

export interface ModelSemanticAccessor {
  readonly kind: 'accessor';
  readonly property: PropertyName;
  readonly method: MethodName;
  readonly semanticType: SemanticType;
  readonly computation: ModelAccessorComputation;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'scalar' }>;
}

export interface ModelSemanticRelation {
  readonly kind: 'relation';
  readonly property: PropertyName;
  readonly relation: RelationName;
  readonly sourceModel: ModelName;
  readonly type: EloquentRelationType;
  readonly targetModel: ModelName;
  readonly cardinality: import('./eloquentTypes').EloquentRelationCardinality;
  readonly multiplicity: ModelPropertyMultiplicity;
  readonly boundCardinality: import('./boundAst').BoundCardinality;
  readonly resourceCardinality: ModelPropertyMultiplicity;
  readonly foreignKey: RelationForeignKey;
  readonly semanticType: SemanticType;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'relation' }>;
}

export class ModelSemanticPropertyIndex {
  private readonly lookupMap: ReadonlyMap<PropertyName, ModelSemanticProperty>;

  constructor(properties: readonly ModelSemanticProperty[]) {
    const lookup = new Map<PropertyName, ModelSemanticProperty>();
    for (const property of properties) {
      lookup.set(property.property, property);
    }
    this.lookupMap = lookup;
    Object.freeze(this);
  }

  public lookup(property: PropertyName): Lookup<ModelSemanticProperty> {
    const entry = this.lookupMap.get(property);
    return entry === undefined ? { kind: 'missing' } : { kind: 'found', value: entry };
  }

  public has(property: PropertyName): boolean {
    return this.lookupMap.has(property);
  }

  public column(property: PropertyName): Lookup<ModelSemanticColumn> {
    const entry = this.lookup(property);
    if (entry.kind === 'missing') return entry;
    return entry.value.kind === 'column'
      ? { kind: 'found', value: entry.value }
      : { kind: 'missing' };
  }

  public access(property: PropertyName): Lookup<ModelPropertyAccessFact> {
    const entry = this.lookup(property);
    if (entry.kind === 'missing') return entry;
    if (entry.value.kind === 'relation') {
      return { kind: 'found', value: { kind: 'relation', property: entry.value } };
    }
    return { kind: 'found', value: { kind: 'scalar', property: entry.value } };
  }

  public get size(): number {
    return this.lookupMap.size;
  }
}

export class ModelSemanticRelationIndex {
  private readonly lookupMap: ReadonlyMap<RelationName, ModelSemanticRelation>;

  constructor(relations: readonly ModelSemanticRelation[]) {
    const lookup = new Map<RelationName, ModelSemanticRelation>();
    for (const relation of relations) lookup.set(relation.relation, relation);
    this.lookupMap = lookup;
    Object.freeze(this);
  }

  public lookup(relation: RelationName): Lookup<ModelSemanticRelation> {
    const entry = this.lookupMap.get(relation);
    return entry === undefined ? { kind: 'missing' } : { kind: 'found', value: entry };
  }

  public get size(): number {
    return this.lookupMap.size;
  }
}

export interface ModelSemanticSurface {
  /** Single semantic property collection; all member kinds live here. */
  readonly properties: readonly ModelSemanticProperty[];
  /** Indexed projections over the same semantic property SSOT. */
  readonly byName: ModelSemanticPropertyIndex;
  readonly relationsByName: ModelSemanticRelationIndex;
}


/** Canonical semantic model contract consumed by downstream lowering. */
export interface ModelSemanticDefinition {
  readonly identity: {
    readonly name: ModelName;
    readonly shortName: ModelName;
    readonly table: TableName;
    readonly primaryKey: ColumnName;
  };
  readonly key: {
    readonly type: ModelKeyType;
    readonly semanticType: ModelKeySemanticType;
  };
  readonly behavior: {
    readonly incrementing: boolean;
    readonly softDeletes: boolean;
    readonly timestamps: boolean;
  };
  readonly exposure: {
    readonly fillable: readonly PropertyName[];
    readonly guarded: readonly PropertyName[];
    readonly hidden: readonly PropertyName[];
    readonly appends: readonly PropertyName[];
  };
  readonly surface: ModelSemanticSurface;
}

/** Canonical model aggregate. Semantic meaning is the domain SSOT; scanner facts stay behind source. */
export interface ParsedModel {
  readonly semantic: ModelSemanticDefinition;
  readonly source: {
    readonly columns: readonly ParsedColumn[];
    readonly columnFacts: readonly import('../upstream/modelSourceFacts').ModelColumnFact[];
    readonly casts: readonly import('./eloquentTypes').ParsedCast[];
  };
}
