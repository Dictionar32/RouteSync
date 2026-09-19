import type { SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceArrayEntry, ResourceFieldExpression } from './expressions';
import type { MethodName, ModelName, PropertyName, PhpFunctionName, VariableName, ResponseFieldName, ResourceName, CastTypeName, SemanticOperator } from './semanticValues';

export type ResourceAccessMode =
  | { readonly kind: 'direct' }
  | { readonly kind: 'nullsafe' };

export type ResourceExpressionBindingRequirement =
  | { readonly kind: 'variable'; readonly name: VariableName }
  | { readonly kind: 'property'; readonly receiver: ResourceExpressionModel; readonly property: PropertyName; readonly access: ResourceAccessMode }
  | { readonly kind: 'method'; readonly receiver: ResourceExpressionModel; readonly method: MethodName; readonly arguments: readonly ResourceExpressionModel[]; readonly access: ResourceAccessMode }
  | { readonly kind: 'static_method'; readonly model: ModelName; readonly method: MethodName; readonly arguments: readonly ResourceExpressionModel[] }
  | { readonly kind: 'array_access'; readonly target: ResourceExpressionModel; readonly index: ResourceExpressionModel }
  | { readonly kind: 'function_call'; readonly functionName: PhpFunctionName; readonly arguments: readonly ResourceExpressionModel[] }
  | { readonly kind: 'cast'; readonly type: CastTypeName; readonly operand: ResourceExpressionModel }
  | { readonly kind: 'computation'; readonly operator: SemanticOperator; readonly left: ResourceExpressionModel; readonly right: ResourceExpressionModel }
  | { readonly kind: 'conditional'; readonly condition: ResourceExpressionModel; readonly truthy: ResourceExpressionModel; readonly falsy: ResourceExpressionModel }
  | { readonly kind: 'short_conditional'; readonly condition: ResourceExpressionModel; readonly falsy: ResourceExpressionModel }
  | { readonly kind: 'null_coalesce'; readonly left: ResourceExpressionModel; readonly right: ResourceExpressionModel }
  | { readonly kind: 'nested_object'; readonly fields: readonly ResourceExpressionFieldModel[] }
  | { readonly kind: 'nested_array'; readonly entries: readonly ResourceArrayEntry[] };

export type ResourceExpressionSemantic =
  | { readonly kind: 'known'; readonly type: SemanticType }
  | { readonly kind: 'requires_binding'; readonly requirement: ResourceExpressionBindingRequirement }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'invalid_boundary_input' };

export interface ResourceExpressionModel {
  readonly expression: ResourceFieldExpression;
  readonly semantic: ResourceExpressionSemantic;
}

export interface ResourceExpressionFieldModel {
  readonly name: ResponseFieldName;
  readonly propertyName: PropertyName;
  readonly value: ResourceExpressionModel;
}

export type ResourceExpressionOrigin =
  | { readonly kind: 'direct_resource'; readonly resource: ResourceName }
  | { readonly kind: 'expression'; readonly expression: ResourceExpressionModel };
