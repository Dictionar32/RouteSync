import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type {
  ControllerVariableSemanticResolutionInputAdapterInterface,
} from '../../../types/upstream/controllerVariableSemanticResolutionInputAdapterInterface';
import type { ControllerVariableSemanticResolutionRequest } from '../../../types/upstream/controllerVariableSemanticInterface';
import type { AstIdentifier, PhpAstValue } from '../lexer/phpAstTypes';
import { controllerVariableSemanticEvidenceAdapter } from './controllerVariableSemanticEvidenceAdapter';

export type ControllerVariableSemanticParameterBinding = readonly [AstIdentifier, ControllerVariableSemantic];
export type PhpControllerVariableSemanticResolutionInputAdapter = ControllerVariableSemanticResolutionInputAdapterInterface<
  PhpAstValue,
  readonly ControllerVariableSemanticParameterBinding[]
>;

const adapt = (input: Parameters<PhpControllerVariableSemanticResolutionInputAdapter['adapt']>[0]): ControllerVariableSemanticResolutionRequest => Object.freeze({
  sourceExpression: input.sourceExpression,
  evidence: controllerVariableSemanticEvidenceAdapter.fromPhpAst(input.expression),
  parameterBindings: Object.freeze(input.parameterSemantics.map(([name, semantic]) => Object.freeze({
    variable: { kind: 'variable_name' as const, value: { kind: 'string_value' as const, value: name } },
    semantic,
  }))),
});

/** PHP syntax adapter only; semantic decisions remain owned by the upstream authority. */
export const phpControllerVariableSemanticResolutionInputAdapter: PhpControllerVariableSemanticResolutionInputAdapter = Object.freeze({
  kind: 'controller_variable_semantic_resolution_input_adapter',
  contractVersion: 2,
  adapt,
});
