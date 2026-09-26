import type { ClassName, ColumnName, ConstantName, DomainTypeName, MethodName, ModelName, PropertyName, RelationName, SourceFile, TableName } from './names';
import type { Cardinality, SemanticValue, Nullability } from './primitiveVocabulary';
import type { TruthValue, StringValues } from './valueObjects';
import type { Expression } from './expression';
import type { PropertySurface } from './property';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';
import type { ModelAccessors, ModelCasts, ModelConstants, ModelMethods, ModelRelations, ModelTraits, Properties, PropertyNames, Columns, ForeignKeys, Lookup, Sequence, ModelColumnFacts } from './collections';

import type { ModelAccessorComputation, ModelAccessorResult, ModelAccessorVisibility, ModelConfigurationVisibility, EloquentRelationCardinality } from './modelVocabulary';
import type { SourceStatements } from './sourceStatements';
import type { DatabaseType } from './databaseVocabulary';

export type ModelTable =
  | { readonly kind: 'conventional'; readonly name: TableName }
  | { readonly kind: 'explicit'; readonly name: TableName };

export type ModelKeyOrigin =
  | { readonly kind: 'conventional' }
  | { readonly kind: 'explicit' };

export type ModelKeyType =
  | { readonly kind: 'integer' }
  | { readonly kind: 'big_integer' }
  | { readonly kind: 'string' }
  | { readonly kind: 'uuid' }
  | { readonly kind: 'ulid' };
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
  | { readonly kind: 'enum'; readonly values: StringValues };
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
      readonly eloquentType: import('./modelVocabulary').EloquentRelationType;
      readonly cardinality: EloquentRelationCardinality;
      readonly multiplicity: ModelRelationMultiplicity;
      readonly targetShape: ModelRelationTargetShape;
      readonly traversalTarget: ModelRelationTraversalTarget;
      readonly semanticType: TypeExpression;
    };

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
  readonly result: ModelAccessorResult;
  readonly computation: ModelAccessorComputation;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'scalar' }>;
};

export type ModelSemanticRelation = {
  readonly kind: 'relation';
  readonly property: PropertyName;
  readonly relation: RelationName;
  readonly sourceModel: ModelName;
  readonly eloquentType: import('./modelVocabulary').EloquentRelationType;
  readonly targetModel: ModelName;
  readonly cardinality: EloquentRelationCardinality;
  readonly multiplicity: ModelPropertyMultiplicity;
  readonly targetShape: ModelRelationTargetShape;
  readonly traversalTarget: ModelRelationTraversalTarget;
  readonly boundCardinality: BoundCardinality;
  readonly resourceCardinality: ModelPropertyMultiplicity;
  readonly foreignKey: RelationKey;
  readonly semanticType: TypeExpression;
  readonly source: SourceSpan;
  readonly traversal: Extract<ModelPropertyTraversalMeaning, { readonly kind: 'relation' }>;
};

export type ModelSemanticProperty = ModelSemanticColumn | ModelSemanticAccessor | ModelSemanticRelation;

export type ModelSemanticSurface = {
  readonly properties: Sequence<ModelSemanticProperty>;
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
  readonly inheritance: ModelInheritance;
  readonly capabilities: ModelSourceCapabilities;
  readonly methods: readonly ModelMethod[];
  readonly constants: readonly ModelConstant[];
  readonly identity: {
    readonly name: ModelName;
    readonly shortName: ModelName;
    readonly table: ModelTable;
    readonly primaryKey: ColumnName;
  };
  readonly key: {
    readonly type: ModelKeyKind;
    readonly semanticType: ModelKeySemanticType;
  };
  readonly behavior: ModelBehavior;
  readonly exposure: ModelExposure;
  readonly surface: ModelSemanticSurface;
  /** Canonical column facts produced from MigrationAst and shared by all model consumers. */
  readonly columnFacts: ModelColumnFacts;
};

export type ModelInheritance =
  | { readonly kind: 'eloquent_model' }
  | { readonly kind: 'authenticatable' }
  | { readonly kind: 'class'; readonly name: ClassName };
export type ModelIdentity = { readonly kind: 'model_identity'; readonly name: ModelName; readonly shortName: ModelName; readonly table: ModelTable; readonly inheritance: ModelInheritance };
export type ModelKeyKind = ModelKeyType;
export type ModelKey = { readonly kind: 'primary_key'; readonly column: ColumnName; readonly type: ModelKeyKind; readonly semanticType: TypeExpression; readonly autoGenerated: TruthValue; readonly origin: ModelKeyOrigin };
export type ModelBehaviorOrigin =
  | { readonly kind: 'laravel_default' }
  | { readonly kind: 'source_explicit' };

export type ModelBehaviorSetting = {
  readonly value: TruthValue;
  readonly origin: ModelBehaviorOrigin;
};

export type ModelBehavior = {
  readonly kind: 'model_behavior';
  readonly incrementing: ModelBehaviorSetting;
  readonly softDeletes: ModelBehaviorSetting;
  readonly timestamps: ModelBehaviorSetting;
};

export type ModelVisibility =
  | { readonly kind: 'default' }
  | { readonly kind: 'hidden'; readonly properties: PropertyNames }
  | { readonly kind: 'visible'; readonly properties: PropertyNames };

export type ModelMassAssignment =
  | { readonly kind: 'default_protection' }
  | { readonly kind: 'fillable'; readonly properties: PropertyNames }
  | { readonly kind: 'guarded'; readonly properties: PropertyNames }
  | { readonly kind: 'unguarded' };

export type ModelConfigurationDeclaration =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly visibility: ModelConfigurationVisibility };

export type ModelExposure = {
  readonly kind: 'model_exposure';
  readonly massAssignment: ModelMassAssignment;
  readonly fillable: PropertyNames;
  readonly guarded: PropertyNames;
  readonly visibility: ModelVisibility;
  readonly hidden: PropertyNames;
  readonly appends: PropertyNames;
  readonly tableDeclaration: ModelConfigurationDeclaration;
  readonly fillableDeclaration: ModelConfigurationDeclaration;
  readonly castsDeclaration: ModelConfigurationDeclaration;
  readonly hiddenDeclaration: ModelConfigurationDeclaration;
  readonly appendsDeclaration: ModelConfigurationDeclaration;
};
export type ModelSourceCapabilities = { readonly kind: 'model_source_capabilities'; readonly traits: ModelTraits };
export type RelationKind = { readonly kind: 'has_one' } | { readonly kind: 'has_many' } | { readonly kind: 'belongs_to' } | { readonly kind: 'belongs_to_many' } | { readonly kind: 'has_one_through' } | { readonly kind: 'has_many_through' } | { readonly kind: 'morph_to' } | { readonly kind: 'morph_one' } | { readonly kind: 'morph_many' } | { readonly kind: 'morph_to_many' } | { readonly kind: 'morphed_by_many' };
export type ModelRelationMultiplicity =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };

export type ModelRelationTargetShape =
  | { readonly kind: 'single'; readonly model: ModelName }
  | { readonly kind: 'collection'; readonly model: ModelName };

export type ModelRelationTraversalTarget =
  | { readonly kind: 'model'; readonly model: ModelName }
  | { readonly kind: 'collection'; readonly model: ModelName };
export type RelationKeyOrigin = { readonly kind: 'convention' } | { readonly kind: 'explicit' };
export type RelationKey = { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly foreign: ColumnName; readonly local: ColumnName };
export type ModelRelation = {
  readonly kind: 'model_relation';
  readonly name: RelationName;
  readonly target: ModelName;
  readonly relation: RelationKind;
  readonly eloquentType: import('./modelVocabulary').EloquentRelationType;
  readonly cardinality: import('./modelVocabulary').EloquentRelationCardinality;
  readonly multiplicity: ModelRelationMultiplicity;
  readonly targetShape: ModelRelationTargetShape;
  readonly traversalTarget: ModelRelationTraversalTarget;
  readonly semanticType: TypeExpression;
  readonly key: RelationKey;
  readonly source: SourceSpan;
};
export type ModelCast = { readonly kind: 'model_cast'; readonly property: PropertyName; readonly target: import('./expression').CastType; readonly source: SourceSpan };
export type ModelSchema = { readonly kind: 'model_schema'; readonly columns: import('./collections').ModelColumnFacts; readonly foreignKeys: ForeignKeys; readonly indexes: import('./collections').Indexes };
export type ModelConstantVisibility =
  | { readonly kind: 'public' }
  | { readonly kind: 'protected' }
  | { readonly kind: 'private' };

export type ModelConstant = {
  readonly kind: 'model_constant';
  readonly name: ConstantName;
  readonly visibility: ModelConstantVisibility;
  readonly value: import('./expression').Expression;
  readonly source: SourceSpan;
};
export type ModelMethodVisibility =
  | { readonly kind: 'public' }
  | { readonly kind: 'protected' }
  | { readonly kind: 'private' };

export type ModelMethodResult =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly type: TypeExpression };

export type ModelMethod = {
  readonly kind: 'model_method';
  readonly name: MethodName;
  readonly visibility: ModelMethodVisibility;
  readonly result: ModelMethodResult;
  readonly body: SourceStatements;
  readonly source: SourceSpan;
};
export type ModelAccessor = { readonly kind: 'model_accessor'; readonly name: PropertyName; readonly method: MethodName; readonly visibility: ModelAccessorVisibility; readonly computation: ModelAccessorComputation; readonly result: ModelAccessorResult; readonly source: SourceSpan };
export type ModelDefinition = { readonly kind: 'model'; readonly identity: ModelIdentity; readonly source: SourceSpan; readonly file: SourceFile; readonly key: ModelKey; readonly behavior: ModelBehavior; readonly exposure: ModelExposure; readonly capabilities: ModelSourceCapabilities; readonly surface: PropertySurface; readonly semanticProperties: Sequence<ModelSemanticProperty>; readonly schema: ModelSchema; readonly properties: Properties; readonly relations: ModelRelations; readonly casts: ModelCasts; readonly computed: ModelAccessors; readonly constants: ModelConstants; readonly methods: ModelMethods; readonly semantic: ModelSemanticDefinition };
