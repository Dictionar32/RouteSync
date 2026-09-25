import type { ClassName, ColumnName, ModelName, PropertyName, RelationName } from './names';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';


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

export type EloquentRelationCardinality =
  | { readonly kind: 'one' }
  | { readonly kind: 'many' };

export type EloquentRelationDescriptor = {
  readonly type: EloquentRelationType;
  readonly relation: import('./model').RelationKind;
  readonly cardinality: EloquentRelationCardinality;
  readonly multiplicity: { readonly kind: 'single' } | { readonly kind: 'collection' };
  readonly polymorphism: { readonly kind: 'non_polymorphic' } | { readonly kind: 'polymorphic' };
};

export type RelationForeignKey =
  | { readonly kind: 'convention' }
  | { readonly kind: 'explicit'; readonly column: ColumnName };

