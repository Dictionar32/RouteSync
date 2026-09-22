import type { ClassName, ColumnName, MethodName, ModelName, PropertyName, RelationName } from './names';
import type { VariableName } from './names';
import type { LiteralValue } from './primitiveVocabulary';
import type { TypeExpression } from './typeVocabulary';


export interface PhpFunctionName {
  readonly kind: 'php_function_name';
  readonly value: import('./valueObjects').StringValue;
}

export interface SemanticOperator {
  readonly kind: 'semantic_operator';
  readonly value:
    | 'add'
    | 'subtract'
    | 'multiply'
    | 'divide'
    | 'modulo'
    | 'equal'
    | 'not_equal'
    | 'less_than'
    | 'less_than_or_equal'
    | 'greater_than'
    | 'greater_than_or_equal'
    | 'and'
    | 'or'
    | 'concat'
    | 'null_coalesce';
}

export type ModelAccessorMatchArm =
  | { readonly kind: 'conditional'; readonly conditions: readonly ModelAccessorExpression[]; readonly value: ModelAccessorExpression }
  | { readonly kind: 'default'; readonly value: ModelAccessorExpression };

export type ModelAccessorExpression =
  | { readonly kind: 'literal'; readonly value: LiteralValue }
  | { readonly kind: 'variable_read'; readonly variable: VariableName }
  | { readonly kind: 'property_read'; readonly property: PropertyName; readonly receiver: ModelAccessorExpression; readonly access: 'direct' | 'nullsafe' }
  | { readonly kind: 'method_call'; readonly method: MethodName; readonly receiver: ModelAccessorExpression; readonly arguments: readonly ModelAccessorExpression[]; readonly access: 'direct' | 'nullsafe' }
  | { readonly kind: 'array_read'; readonly target: ModelAccessorExpression; readonly index: ModelAccessorExpression }
  | { readonly kind: 'function_call'; readonly functionName: PhpFunctionName; readonly arguments: readonly ModelAccessorExpression[] }
  | { readonly kind: 'static_call'; readonly className: ClassName; readonly method: MethodName; readonly arguments: readonly ModelAccessorExpression[] }
  | { readonly kind: 'binary'; readonly operator: SemanticOperator; readonly left: ModelAccessorExpression; readonly right: ModelAccessorExpression }
  | { readonly kind: 'unary'; readonly operator: { readonly kind: 'semantic_unary_operator'; readonly value: 'not' | 'negative' | 'positive' | 'bitwise_not' }; readonly operand: ModelAccessorExpression }
  | { readonly kind: 'cast'; readonly castType: { readonly kind: 'semantic_cast'; readonly value: 'int' | 'float' | 'string' | 'bool' | 'array' | 'object' }; readonly operand: ModelAccessorExpression }
  | { readonly kind: 'ternary'; readonly condition: ModelAccessorExpression; readonly truthy: ModelAccessorExpression; readonly falsy: ModelAccessorExpression }
  | { readonly kind: 'short_ternary'; readonly condition: ModelAccessorExpression; readonly falsy: ModelAccessorExpression }
  | { readonly kind: 'array_literal'; readonly entries: readonly { readonly kind: 'positional' | 'keyed'; readonly value: ModelAccessorExpression }[] }
  | { readonly kind: 'match'; readonly subject: ModelAccessorExpression; readonly arms: readonly ModelAccessorMatchArm[] }
  | { readonly kind: 'class_reference'; readonly className: ClassName }
  | { readonly kind: 'resource'; readonly resourceName: ClassName; readonly argument: ModelAccessorExpression }
  | { readonly kind: 'resource_collection'; readonly resourceName: ClassName; readonly argument: ModelAccessorExpression }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'missing_return_expression' };

export type ModelAccessorComputation =
  | { readonly kind: 'expression'; readonly expression: ModelAccessorExpression; readonly result: TypeExpression }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'missing_return_expression'; readonly result: TypeExpression };

export const EloquentRelationType = Object.freeze({
  HasOne: 'hasOne', HasMany: 'hasMany', BelongsTo: 'belongsTo', BelongsToMany: 'belongsToMany',
  HasOneThrough: 'hasOneThrough', HasManyThrough: 'hasManyThrough', MorphTo: 'morphTo', MorphOne: 'morphOne',
  MorphMany: 'morphMany', MorphToMany: 'morphToMany', MorphedByMany: 'morphedByMany'
} as const);
export type EloquentRelationType = typeof EloquentRelationType[keyof typeof EloquentRelationType];
export type EloquentRelationCardinality = 'one' | 'many';


export type EloquentRelationDescriptor = {
  readonly type: EloquentRelationType;
  readonly relation: import('./model').RelationKind;
  readonly cardinality: EloquentRelationCardinality;
  readonly isCollection: boolean;
  readonly isPolymorphic: boolean;
};

const ELOQUENT_RELATION_DESCRIPTORS: ReadonlyMap<EloquentRelationType, EloquentRelationDescriptor> = new Map([
  [EloquentRelationType.HasOne, { type: EloquentRelationType.HasOne, relation: { kind: 'has_one' }, cardinality: 'one', isCollection: false, isPolymorphic: false }],
  [EloquentRelationType.HasMany, { type: EloquentRelationType.HasMany, relation: { kind: 'has_many' }, cardinality: 'many', isCollection: true, isPolymorphic: false }],
  [EloquentRelationType.BelongsTo, { type: EloquentRelationType.BelongsTo, relation: { kind: 'belongs_to' }, cardinality: 'one', isCollection: false, isPolymorphic: false }],
  [EloquentRelationType.BelongsToMany, { type: EloquentRelationType.BelongsToMany, relation: { kind: 'belongs_to_many' }, cardinality: 'many', isCollection: true, isPolymorphic: false }],
  [EloquentRelationType.HasOneThrough, { type: EloquentRelationType.HasOneThrough, relation: { kind: 'has_one_through' }, cardinality: 'one', isCollection: false, isPolymorphic: false }],
  [EloquentRelationType.HasManyThrough, { type: EloquentRelationType.HasManyThrough, relation: { kind: 'has_many_through' }, cardinality: 'many', isCollection: true, isPolymorphic: false }],
  [EloquentRelationType.MorphTo, { type: EloquentRelationType.MorphTo, relation: { kind: 'morph_to' }, cardinality: 'one', isCollection: false, isPolymorphic: true }],
  [EloquentRelationType.MorphOne, { type: EloquentRelationType.MorphOne, relation: { kind: 'morph_one' }, cardinality: 'one', isCollection: false, isPolymorphic: true }],
  [EloquentRelationType.MorphMany, { type: EloquentRelationType.MorphMany, relation: { kind: 'morph_many' }, cardinality: 'many', isCollection: true, isPolymorphic: true }],
  [EloquentRelationType.MorphToMany, { type: EloquentRelationType.MorphToMany, relation: { kind: 'morph_to_many' }, cardinality: 'many', isCollection: true, isPolymorphic: true }],
  [EloquentRelationType.MorphedByMany, { type: EloquentRelationType.MorphedByMany, relation: { kind: 'morphed_by_many' }, cardinality: 'many', isCollection: true, isPolymorphic: true }],
]);

export const ModelRelationClassifier = Object.freeze({
  isRelationMethod(name: string): name is EloquentRelationType {
    return ELOQUENT_RELATION_DESCRIPTORS.has(name as EloquentRelationType);
  },
  descriptor(type: EloquentRelationType): EloquentRelationDescriptor {
    const descriptor = ELOQUENT_RELATION_DESCRIPTORS.get(type);
    if (descriptor === undefined) throw new Error(`Unsupported Eloquent relation method: ${type}`);
    return descriptor;
  },
});

export type RelationForeignKey =
  | { readonly kind: 'convention' }
  | { readonly kind: 'explicit'; readonly column: ColumnName };

