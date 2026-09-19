import type { ParsedColumn } from './databaseColumns';
import type { EloquentCastKind, EloquentCastValueType, EloquentRelationType, RelationForeignKey, RelationTargetShape, ModelAccessorComputation } from './eloquentTypes';
import type { ModelKeySemanticType, ModelKeyType } from './modelContracts';
import type { CastTypeName, ColumnName, ModelName, PropertyName, RelationName, TableName } from './semanticValues';
import type { DatabaseColumnType, Nullability } from './modelContracts';
import type { MethodName } from './semanticValues';
import type { SemanticType } from '../../compiler/types/SemanticType';

export type ModelPropertyMultiplicity =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };

export interface ModelColumnOrigin {
  readonly kind: 'column';
  readonly column: ColumnName;
  readonly databaseType: DatabaseColumnType;
  readonly nullability: Nullability;
}


export interface ModelAccessorOrigin {
  readonly kind: 'accessor';
  readonly accessor: PropertyName;
  readonly method: MethodName;
  readonly computation: ModelAccessorComputation;
}

export interface ModelCastOrigin {
  readonly kind: 'cast';
  readonly column: ColumnName;
  readonly castKind: EloquentCastKind;
  readonly targetType: CastTypeName;
  readonly valueType: EloquentCastValueType;
}

export interface ModelRelationOrigin {
  readonly kind: 'relation';
  readonly relation: RelationName;
  readonly relationType: EloquentRelationType;
  readonly targetModel: ModelName;
  readonly multiplicity: ModelPropertyMultiplicity;
  readonly targetShape: RelationTargetShape;
  readonly traversalTarget: { readonly kind: 'model'; readonly model: ModelName } | { readonly kind: 'collection'; readonly model: ModelName };
  readonly foreignKey: RelationForeignKey;
}

/** Semantic origin vocabulary. It contains no scanner descriptor or AST payload. */
export type ModelPropertyOrigin =
  | ModelColumnOrigin
  | ModelCastOrigin
  | ModelAccessorOrigin
  | ModelRelationOrigin;

export type ModelSemanticProperty =
  | ModelSemanticColumn
  | ModelSemanticAccessor
  | ModelSemanticRelation;

/** Fully classified model surface. Downstream consumes this, never raw scanner members. */
export interface ModelSemanticColumn {
  readonly kind: 'column';
  readonly property: PropertyName;
  readonly column: ColumnName;
  readonly type: SemanticType;
  readonly origin: ModelColumnOrigin | ModelCastOrigin;
}

export interface ModelSemanticAccessor {
  readonly kind: 'accessor';
  readonly property: PropertyName;
  readonly method: MethodName;
  readonly type: SemanticType;
  readonly computation: ModelAccessorComputation;
}

export interface ModelSemanticRelation {
  readonly kind: 'relation';
  readonly property: PropertyName;
  readonly relation: RelationName;
  readonly type: EloquentRelationType;
  readonly targetModel: ModelName;
  readonly cardinality: import('./eloquentTypes').EloquentRelationCardinality;
  readonly multiplicity: ModelPropertyMultiplicity;
  readonly targetShape: RelationTargetShape;
  readonly traversalTarget: { readonly kind: 'model'; readonly model: ModelName } | { readonly kind: 'collection'; readonly model: ModelName };
  readonly foreignKey: RelationForeignKey;
  readonly semanticType: SemanticType;
}

export class ModelSemanticPropertyIndex {
  private readonly lookup: ReadonlyMap<PropertyName, ModelSemanticProperty>;

  constructor(properties: readonly ModelSemanticProperty[]) {
    const lookup = new Map<PropertyName, ModelSemanticProperty>();
    for (const property of properties) {
      lookup.set(property.property, property);
    }
    this.lookup = lookup;
    Object.freeze(this);
  }

  public get(property: PropertyName): ModelSemanticProperty | undefined {
    return this.lookup.get(property);
  }

  public has(property: PropertyName): boolean {
    return this.lookup.has(property);
  }

  public get size(): number {
    return this.lookup.size;
  }
}

export interface ModelSemanticSurface {
  readonly properties: readonly ModelSemanticProperty[];
  readonly columns: readonly ModelSemanticColumn[];
  readonly accessors: readonly ModelSemanticAccessor[];
  readonly relations: readonly ModelSemanticRelation[];
  readonly byName: ModelSemanticPropertyIndex;
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
  readonly surface: ModelSemanticSurface;
}

/** Scanner aggregate. Raw members remain upstream-only provenance/facts. */
export interface ParsedModel {
  readonly name: ModelName;
  readonly shortName: ModelName;
  readonly table: TableName;
  readonly primaryKey: ColumnName;
  readonly keyType: ModelKeyType;
  readonly keySemanticType: ModelKeySemanticType;
  readonly incrementing: boolean;
  readonly softDeletes: boolean;
  readonly timestamps: boolean;
  readonly columns: readonly ParsedColumn[];
  readonly semantic: ModelSemanticDefinition;
  readonly fillable: readonly PropertyName[];
  readonly guarded: readonly PropertyName[];
  readonly hidden: readonly PropertyName[];
  readonly appends: readonly PropertyName[];
  readonly casts: readonly import('./eloquentTypes').ParsedCast[];
  readonly accessors: readonly import('./eloquentTypes').ParsedAccessor[];
  readonly relations: readonly import('./eloquentTypes').ParsedRelation[];
}
