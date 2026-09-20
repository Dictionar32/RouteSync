import type { SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceArrayEntry, ResourceFieldExpression } from './expressions';
import type { MethodName, ModelName, PropertyName, PhpFunctionName, VariableName, ResponseFieldName, ResourceName, CastTypeName, SemanticOperator, ClassName } from './semanticValues';
import type { ResourceClosureStatement, ResourceMatchArm, ResourceUnaryOperator } from './expressions';
import type { Expression } from '../upstream/expression';

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
  | { readonly kind: 'nested_array'; readonly entries: readonly ResourceArrayEntry[] }
  | { readonly kind: 'unary'; readonly operator: ResourceUnaryOperator; readonly operand: ResourceExpressionModel }
  | { readonly kind: 'match'; readonly subject: ResourceExpressionModel; readonly arms: readonly ResourceMatchArm[] }
  | { readonly kind: 'class_reference'; readonly className: ClassName }
  | { readonly kind: 'construct'; readonly className: ClassName; readonly arguments: readonly ResourceExpressionModel[] }
  | { readonly kind: 'instance_of'; readonly expression: ResourceExpressionModel; readonly className: ClassName }
  | { readonly kind: 'closure'; readonly parameters: readonly VariableName[]; readonly captures: readonly { readonly kind: 'by_value' | 'by_reference'; readonly variable: VariableName }[]; readonly body: readonly ResourceClosureStatement[] }
  | { readonly kind: 'arrow_function'; readonly parameters: readonly VariableName[]; readonly body: ResourceExpressionModel }
  | { readonly kind: 'statement'; readonly statementKind: string };

export type ResourceExpressionSemantic =
  | { readonly kind: 'known'; readonly type: SemanticType }
  | { readonly kind: 'requires_binding'; readonly requirement: ResourceExpressionBindingRequirement }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'invalid_boundary_input' };

export interface ResourceExpressionModel {
  /** Canonical upstream expression; the scanner semantic model is derived from this value. */
  readonly upstream: Expression;
  /** Domain projection retained for the current resource lowering boundary. */
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
