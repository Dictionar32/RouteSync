import type { ClassName, ColumnName, ConstantName, DomainTypeName, MethodName, ModelName, PropertyName, RelationName, SourceFile, TableName } from './names';
import type { Cardinality, SemanticValue, Nullability } from './primitiveVocabulary';
import type { TruthValue } from './valueObjects';
import type { ResolvedExpression } from './expression';
import type { PropertySurface } from './property';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';
import type { ModelAccessors, ModelCasts, ModelConstants, ModelMethods, ModelRelations, ModelTraits, Properties, PropertyNames, Columns, ForeignKeys } from './collections';
import type { ModelColumnFact } from './modelSourceFacts';

import type { ModelAccessorComputation } from './modelVocabulary';
import type { DatabaseType } from './databaseVocabulary';

export type ModelKeyType = 'int' | 'bigint' | 'string' | 'uuid' | 'ulid';
export type ModelKeySemanticType =
  | { readonly kind: 'number' }
  | { readonly kind: 'string' };
export type DatabaseColumnType =
  | { readonly kind: 'bigint' }
  | { readonly kind: 'integer' }
  | { readonly kind: 'smallint' }
  | { readonly kind: 'tinyint' }
  | { readonly kind: 'float' }
  | { readonly kind: 'double' }
  | { readonly kind: 'decimal' }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'string' }
  | { readonly kind: 'text' }
  | { readonly kind: 'mediumtext' }
  | { readonly kind: 'longtext' }
  | { readonly kind: 'date' }
  | { readonly kind: 'datetime' }
  | { readonly kind: 'timestamp' }
  | { readonly kind: 'time' }
  | { readonly kind: 'json' }
  | { readonly kind: 'enum'; readonly values: readonly string[] };
export type BoundCardinality =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' }
  | { readonly kind: 'paginated_collection' };

export type ModelPropertyMultiplicity =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };

export type ModelPropertyTraversalMeaning =
  | { readonly kind: 'scalar'; readonly semanticType: TypeExpression }
  | {
      readonly kind: 'relation';
      readonly targetModel: ModelName;
      readonly cardinality: EloquentRelationCardinality;
      readonly multiplicity: import('./modelSourceFacts').ModelRelationMultiplicity;
      readonly targetShape: import('./modelSourceFacts').ModelRelationTargetShape;
      readonly traversalTarget: import('./modelSourceFacts').ModelRelationTraversalTarget;
      readonly semanticType: TypeExpression;
    };

export type EloquentRelationCardinality = 'one' | 'many';

export type ModelSemanticColumn = {
  readonly kind: 'column';
  readonly property: PropertyName;
  readonly column: ColumnName;
  readonly databaseType: DatabaseType;
  readonly semanticType: TypeExpression;
  readonly nullability: Nullability;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'scalar' }>;
};

export type ModelSemanticAccessor = {
  readonly kind: 'accessor';
  readonly property: PropertyName;
  readonly method: MethodName;
  readonly semanticType: TypeExpression;
  readonly computation: ModelAccessorComputation;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'scalar' }>;
};

export type ModelSemanticRelation = {
  readonly kind: 'relation';
  readonly property: PropertyName;
  readonly relation: RelationName;
  readonly sourceModel: ModelName;
  readonly type: RelationKind;
  readonly targetModel: ModelName;
  readonly cardinality: EloquentRelationCardinality;
  readonly multiplicity: ModelPropertyMultiplicity;
  readonly targetShape: import('./modelSourceFacts').ModelRelationTargetShape;
  readonly traversalTarget: import('./modelSourceFacts').ModelRelationTraversalTarget;
  readonly boundCardinality: BoundCardinality;
  readonly resourceCardinality: ModelPropertyMultiplicity;
  readonly foreignKey: RelationKey;
  readonly semanticType: TypeExpression;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'relation' }>;
};

export type ModelSemanticProperty = ModelSemanticColumn | ModelSemanticAccessor | ModelSemanticRelation;

export type ModelSemanticSurface = {
  readonly properties: readonly ModelSemanticProperty[];
  readonly byName: ModelSemanticPropertyIndex;
  readonly relationsByName: ModelSemanticRelationIndex;
};

export class ModelSemanticPropertyIndex {
  private readonly lookupMap: ReadonlyMap<PropertyName, ModelSemanticProperty>;

  constructor(properties: readonly ModelSemanticProperty[]) {
    const lookup = new Map<PropertyName, ModelSemanticProperty>();
    for (const property of properties) lookup.set(property.property, property);
    this.lookupMap = lookup;
    Object.freeze(this);
  }

  public lookup(property: PropertyName): Lookup<ModelSemanticProperty> {
    const entry = this.lookupMap.get(property);
    return entry === undefined ? { kind: 'missing' } : { kind: 'found', value: entry };
  }

  public has(property: PropertyName): boolean { return this.lookupMap.has(property); }

  public column(property: PropertyName): Lookup<ModelSemanticColumn> {
    const entry = this.lookup(property);
    if (entry.kind === 'missing') return entry;
    return entry.value.kind === 'column' ? { kind: 'found', value: entry.value } : { kind: 'missing' };
  }

  public access(property: PropertyName): Lookup<ModelPropertyAccessFact> {
    const entry = this.lookup(property);
    if (entry.kind === 'missing') return entry;
    if (entry.value.kind === 'relation') return { kind: 'found', value: { kind: 'relation', property: entry.value } };
    return { kind: 'found', value: { kind: 'scalar', property: entry.value } };
  }

  public get size(): number { return this.lookupMap.size; }
}

export type ModelPropertyAccessFact =
  | { readonly kind: 'scalar'; readonly property: ModelSemanticColumn | ModelSemanticAccessor }
  | { readonly kind: 'relation'; readonly property: ModelSemanticRelation };

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

  public get size(): number { return this.lookupMap.size; }
}

export type ModelSemanticDefinition = {
  readonly identity: {
    readonly name: ModelName;
    readonly shortName: ModelName;
    readonly table: TableName;
    readonly primaryKey: ColumnName;
  };
  readonly key: {
    readonly type: ModelKeyKind;
    readonly semanticType: ModelKeySemanticType;
  };
  readonly behavior: {
    readonly incrementing: TruthValue;
    readonly softDeletes: TruthValue;
    readonly timestamps: TruthValue;
  };
  readonly exposure: {
    readonly fillable: readonly PropertyName[];
    readonly guarded: readonly PropertyName[];
    readonly hidden: readonly PropertyName[];
    readonly appends: readonly PropertyName[];
  };
  readonly surface: ModelSemanticSurface;
  /** Canonical column facts produced from MigrationAst and shared by all model consumers. */
  readonly columnFacts: readonly ModelColumnFact[];
};

export type ModelInheritance =
  | { readonly kind: 'eloquent_model' }
  | { readonly kind: 'authenticatable' }
  | { readonly kind: 'class'; readonly name: ClassName };
export type ModelIdentity = { readonly kind: 'model_identity'; readonly name: ModelName; readonly shortName: ModelName; readonly table: TableName; readonly inheritance: ModelInheritance };
export type ModelKeyKind = { readonly kind: 'integer' } | { readonly kind: 'big_integer' } | { readonly kind: 'string' } | { readonly kind: 'uuid' } | { readonly kind: 'ulid' };
export type ModelKey = { readonly kind: 'primary_key'; readonly column: ColumnName; readonly type: ModelKeyKind; readonly semanticType: TypeExpression; readonly autoGenerated: TruthValue };
export type ModelBehavior = { readonly kind: 'model_behavior'; readonly incrementing: TruthValue; readonly softDeletes: TruthValue; readonly timestamps: TruthValue };
export type ModelExposure = { readonly kind: 'model_exposure'; readonly fillable: PropertyNames; readonly guarded: PropertyNames; readonly hidden: PropertyNames; readonly appends: PropertyNames };
export type ModelSourceCapabilities = { readonly kind: 'model_source_capabilities'; readonly traits: ModelTraits };
export type RelationKind = { readonly kind: 'has_one' } | { readonly kind: 'has_many' } | { readonly kind: 'belongs_to' } | { readonly kind: 'belongs_to_many' } | { readonly kind: 'has_one_through' } | { readonly kind: 'has_many_through' } | { readonly kind: 'morph_to' } | { readonly kind: 'morph_one' } | { readonly kind: 'morph_many' } | { readonly kind: 'morph_to_many' } | { readonly kind: 'morphed_by_many' };
export type RelationKeyOrigin = { readonly kind: 'convention' } | { readonly kind: 'explicit' };
export type RelationKey = { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly foreign: ColumnName; readonly local: ColumnName };
export type ModelRelation = {
  readonly kind: 'model_relation';
  readonly name: RelationName;
  readonly target: ModelName;
  readonly relation: RelationKind;
  readonly cardinality: import('./modelVocabulary').EloquentRelationCardinality;
  readonly multiplicity: import('./modelSourceFacts').ModelRelationMultiplicity;
  readonly targetShape: import('./modelSourceFacts').ModelRelationTargetShape;
  readonly traversalTarget: import('./modelSourceFacts').ModelRelationTraversalTarget;
  readonly semanticType: TypeExpression;
  readonly key: RelationKey;
  readonly source: SourceSpan;
};
export type ModelCast = { readonly kind: 'model_cast'; readonly property: PropertyName; readonly target: import('./expression').CastType; readonly source: SourceSpan };
export type ModelSchema = { readonly kind: 'model_schema'; readonly columns: import('./collections').ModelColumnFacts; readonly foreignKeys: ForeignKeys; readonly indexes: import('./collections').Indexes };
export type ModelConstant = { readonly kind: 'model_constant'; readonly name: ConstantName; readonly value: import('./expression').Expression; readonly source: SourceSpan };
export type ModelMethod = { readonly kind: 'model_method'; readonly name: MethodName; readonly result: TypeExpression; readonly body: SourceSpan; readonly source: SourceSpan };
export type ModelAccessor = { readonly kind: 'model_accessor'; readonly name: PropertyName; readonly expression: ResolvedExpression; readonly source: SourceSpan };
export type ModelDefinition = { readonly kind: 'model'; readonly identity: ModelIdentity; readonly source: SourceSpan; readonly file: SourceFile; readonly key: ModelKey; readonly behavior: ModelBehavior; readonly exposure: ModelExposure; readonly capabilities: ModelSourceCapabilities; readonly surface: PropertySurface; readonly semanticProperties: readonly ModelSemanticProperty[]; readonly schema: ModelSchema; readonly properties: Properties; readonly relations: ModelRelations; readonly casts: ModelCasts; readonly computed: ModelAccessors; readonly constants: ModelConstants; readonly methods: ModelMethods; readonly semantic: ModelSemanticDefinition };
