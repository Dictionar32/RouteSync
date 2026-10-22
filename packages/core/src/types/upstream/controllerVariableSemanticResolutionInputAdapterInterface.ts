import type { ControllerVariableSemanticResolutionRequest } from './controllerVariableSemanticInterface';
import type { Expression as CanonicalExpression } from './expression';

/** Parser-specific inputs are converted into the existing canonical semantic-resolution request. */
export interface ControllerVariableSemanticResolutionInputAdapterInput<Expression, ParameterSemantics> {
  readonly kind: 'controller_variable_semantic_resolution_input_adapter_input';
  readonly expression: Expression;
  readonly sourceExpression: CanonicalExpression;
  readonly parameterSemantics: ParameterSemantics;
}

/**
 * Source adapter contract: translate parser syntax and source parameter metadata into the
 * canonical upstream request. It does not resolve meaning or select semantic rules.
 */
export interface ControllerVariableSemanticResolutionInputAdapterInterface<Expression, ParameterSemantics> {
  readonly kind: 'controller_variable_semantic_resolution_input_adapter';
  readonly contractVersion: 2;
  readonly adapt: (input: ControllerVariableSemanticResolutionInputAdapterInput<Expression, ParameterSemantics>) => ControllerVariableSemanticResolutionRequest;
}

export interface ControllerVariableSemanticResolutionInputAdapterContract {
  readonly kind: 'controller_variable_semantic_resolution_input_adapter_contract';
  readonly version: 2;
  readonly responsibility: 'adapt-source-expression-and-typed-parameter-semantics-into-canonical-request-while-retaining-the-exact-canonical-expression-that-produced-the-source-evidence';
  readonly excludedResponsibilities: 'semantic-rule-selection-resolution-and-judgment-closure-remain-owned-by-controller-variable-semantic-authority;judgment-retains-the-exact-sourceExpression-reference';
}

export const CONTROLLER_VARIABLE_SEMANTIC_RESOLUTION_INPUT_ADAPTER_CONTRACT: ControllerVariableSemanticResolutionInputAdapterContract = Object.freeze({
  kind: 'controller_variable_semantic_resolution_input_adapter_contract',
  version: 2,
  responsibility: 'adapt-source-expression-and-typed-parameter-semantics-into-canonical-request-while-retaining-the-exact-canonical-expression-that-produced-the-source-evidence',
  excludedResponsibilities: 'semantic-rule-selection-resolution-and-judgment-closure-remain-owned-by-controller-variable-semantic-authority;judgment-retains-the-exact-sourceExpression-reference',
});
