import type { SemanticType } from '../../compiler/types/SemanticType';
import type { MethodName, PhpFunctionName, PropertyName, VariableName } from './semanticValues';

export type ResourceComputationSource =
  | { readonly kind: 'variable'; readonly variable: VariableName }
  | { readonly kind: 'property'; readonly property: PropertyName }
  | { readonly kind: 'collection_property'; readonly property: PropertyName }
  | { readonly kind: 'literal' };

export type ResourceComputationOperation =
  | { readonly kind: 'to_array'; readonly method: MethodName }
  | { readonly kind: 'array_column'; readonly method: MethodName; readonly property: PropertyName }
  | { readonly kind: 'array_sum'; readonly functionName: PhpFunctionName }
  | { readonly kind: 'cast'; readonly target: 'number' | 'string' | 'boolean' };

export type ResourceComputedValue =
  | { readonly kind: 'scalar'; readonly type: SemanticType }
  | { readonly kind: 'collection'; readonly element: SemanticType }
  | { readonly kind: 'rejected'; readonly reason: ResourceComputationRejection };

export type ResourceComputationRejection =
  | 'unsupported_source'
  | 'unsupported_operation'
  | 'unresolved_semantic_type';

export interface ResourceComputationSemantic {
  readonly source: ResourceComputationSource;
  readonly operations: readonly ResourceComputationOperation[];
  readonly result: ResourceComputedValue;
}
