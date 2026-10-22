import type { ControllerVariableSemanticAuthorityInterface, ControllerVariableSemanticRuntimeExecutorInterface, ControllerVariableSemanticResolutionRequest } from './controllerVariableSemanticInterface';

export const createControllerVariableSemanticRuntimeExecutor = (
  authority: ControllerVariableSemanticAuthorityInterface,
): ControllerVariableSemanticRuntimeExecutorInterface => Object.freeze({
  kind: 'controller_variable_semantic_runtime_executor',
  authority: 'upstream',
  judgmentContract: 'semantic_and_expression_value_are_integrated',
  execute: (request: ControllerVariableSemanticResolutionRequest) => authority.resolve(request),
});
