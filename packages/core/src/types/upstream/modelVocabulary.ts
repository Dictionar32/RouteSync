import { relationResolve, relationEqual } from '../../semantic/kernel/semanticRelations';
import type { ClassName, ColumnName, ModelName, PropertyName, RelationName, MethodName } from './names';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';
import type { Cardinality, LiteralValue } from './primitiveVocabulary';


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

export type ModelAccessorVisibility =
  | { readonly kind: 'public' }
  | { readonly kind: 'protected' }
  | { readonly kind: 'private' };

export type ModelConfigurationVisibility =
  | { readonly kind: 'public' }
  | { readonly kind: 'protected' }
  | { readonly kind: 'private' };

export type ModelAccessorResult =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly type: TypeExpression };

export type ModelAccessorExpression =
  | { readonly kind: 'literal'; readonly value: LiteralValue }
  | { readonly kind: 'variable_read'; readonly variable: import('./names').VariableName }
  | { readonly kind: 'property_read'; readonly property: PropertyName; readonly receiver: ModelAccessorExpression; readonly access: string }
  | { readonly kind: 'method_call'; readonly method: MethodName; readonly receiver: ModelAccessorExpression; readonly arguments: readonly ModelAccessorExpression[]; readonly access: string }
  | { readonly kind: 'array_read'; readonly target: ModelAccessorExpression; readonly index: ModelAccessorExpression }
  | { readonly kind: 'function_call'; readonly functionName: PhpFunctionName; readonly arguments: readonly ModelAccessorExpression[] }
  | { readonly kind: 'static_call'; readonly className: ClassName; readonly method: MethodName; readonly arguments: readonly ModelAccessorExpression[] }
  | { readonly kind: 'binary'; readonly operator: SemanticOperator; readonly left: ModelAccessorExpression; readonly right: ModelAccessorExpression }
  | { readonly kind: 'unary'; readonly operator: { readonly kind: 'semantic_unary_operator'; readonly value: 'not' | 'negative' | 'positive' | 'bitwise_not' }; readonly operand: ModelAccessorExpression }
  | { readonly kind: 'cast'; readonly castType: { readonly kind: 'semantic_cast'; readonly value: string }; readonly operand: ModelAccessorExpression }
  | { readonly kind: 'ternary'; readonly condition: ModelAccessorExpression; readonly truthy: ModelAccessorExpression; readonly falsy: ModelAccessorExpression }
  | { readonly kind: 'short_ternary'; readonly condition: ModelAccessorExpression; readonly falsy: ModelAccessorExpression }
  | { readonly kind: 'array_literal'; readonly entries: readonly { readonly kind: string; readonly value: ModelAccessorExpression }[] }
  | { readonly kind: 'match'; readonly subject: ModelAccessorExpression; readonly arms: readonly ModelAccessorMatchArm[] }
  | { readonly kind: 'class_reference'; readonly className: ClassName }
  | { readonly kind: 'resource'; readonly resourceName: ClassName; readonly argument: ModelAccessorExpression }
  | { readonly kind: 'resource_collection'; readonly resourceName: ClassName; readonly argument: ModelAccessorExpression }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'missing_return_expression' };

export type ModelAccessorMatchArm =
  | { readonly kind: 'conditional'; readonly conditions: readonly ModelAccessorExpression[]; readonly value: ModelAccessorExpression }
  | { readonly kind: 'default'; readonly value: ModelAccessorExpression };

export type ModelAccessorComputation =
  | { readonly kind: 'expression'; readonly expression: import('./expression').Expression }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'missing_return_expression'; readonly source: SourceSpan };

export type EloquentRelationType =
  | { readonly kind: 'has_one' }
  | { readonly kind: 'has_many' }
  | { readonly kind: 'belongs_to' }
  | { readonly kind: 'belongs_to_many' }
  | { readonly kind: 'has_one_through' }
  | { readonly kind: 'has_many_through' }
  | { readonly kind: 'morph_to' }
  | { readonly kind: 'morph_one' }
  | { readonly kind: 'morph_many' }
  | { readonly kind: 'morph_to_many' }
  | { readonly kind: 'morphed_by_many' };

export const EloquentRelationType = Object.freeze({
  HasOne: { kind: 'has_one' },
  HasMany: { kind: 'has_many' },
  BelongsTo: { kind: 'belongs_to' },
  BelongsToMany: { kind: 'belongs_to_many' },
  HasOneThrough: { kind: 'has_one_through' },
  HasManyThrough: { kind: 'has_many_through' },
  MorphTo: { kind: 'morph_to' },
  MorphOne: { kind: 'morph_one' },
  MorphMany: { kind: 'morph_many' },
  MorphToMany: { kind: 'morph_to_many' },
  MorphedByMany: { kind: 'morphed_by_many' },
} as const);

export type EloquentRelationCardinality = Cardinality;


export type EloquentRelationMultiplicity =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' };

export const eloquentRelationMultiplicity = (cardinality: EloquentRelationCardinality): EloquentRelationMultiplicity =>
  relationResolve(relationEqual(cardinality.kind, 'many'), () => ({ kind: 'collection' }), () => ({ kind: 'single' }));

export type EloquentRelationDescriptor = {
  readonly type: EloquentRelationType;
  readonly relation: import('./model').RelationKind;
  readonly cardinality: EloquentRelationCardinality;
  readonly polymorphism: { readonly kind: 'non_polymorphic' } | { readonly kind: 'polymorphic' };
};

export type RelationForeignKey =
  | { readonly kind: 'convention' }
  | { readonly kind: 'explicit'; readonly column: ColumnName };

