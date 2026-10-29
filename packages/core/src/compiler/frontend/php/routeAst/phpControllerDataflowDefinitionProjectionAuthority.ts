import type { ControllerVariableDefinition, ControllerVariableSemantic } from '../../../../types/upstream/controller';
import type { ControllerDataflowDefinitionProjectionAuthorityInterface } from '../../../../types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface';
import type { ControllerVariableSemanticAuthorityInterface } from '../../../../types/upstream/controllerVariableSemanticInterface';
import type { PhpAstExpressionSemanticAuthorityInterface } from '../../../../types/upstream/phpAstExpressionSemanticAuthorityInterface';
import type { ControllerVariableSemanticResolutionInputAdapterInterface } from '../../../../types/upstream/controllerVariableSemanticResolutionInputAdapterInterface';
import type { AstIdentifier, PhpAstValue } from '../phpAstTypes';
import type { SemanticBinding } from '../../../../types/upstream/semanticDataflowKnowledge';
import type { PhpControllerDataflowPayload } from './phpControllerDataflowSourcePayloadEvidenceAdapter';

export interface PhpControllerDataflowDefinitionProjectionDependencies {
  readonly parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[];
  readonly semanticAuthority: ControllerVariableSemanticAuthorityInterface;
  readonly expressionAuthority: PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>;
  readonly semanticResolutionInputAdapter: ControllerVariableSemanticResolutionInputAdapterInterface<PhpAstValue, readonly (readonly [AstIdentifier, ControllerVariableSemantic])[]>;
}

export const createPhpControllerDataflowDefinitionProjectionAuthority = (
  dependencies: PhpControllerDataflowDefinitionProjectionDependencies,
): ControllerDataflowDefinitionProjectionAuthorityInterface<SemanticBinding, PhpControllerDataflowPayload> => Object.freeze({
  kind: 'controller_dataflow_definition_projection_authority',
  sourceBinding: 'definition-expression-projection-uses-the-exact-matched-payload-source-file-after-authority-source-identity-closure;semantic-resolution-judgment-retains-the-exact-canonical-expression-projected-from-that-same-matched-payload;the-binding-judgment-retains-the-payload-source-span-as-provenance',
  project: input => {
    const expression = dependencies.expressionAuthority.derive({
      kind: 'php_ast_expression_evidence',
      evidence: input.correspondence.payload.payload.value,
      sourceFile: input.correspondence.payload.source.file,
      classContext: { kind: 'none' },
    });
    const semanticResolution = dependencies.semanticAuthority.resolve(dependencies.semanticResolutionInputAdapter.adapt({
      kind: 'controller_variable_semantic_resolution_input_adapter_input',
      expression: input.correspondence.payload.payload.value,
      sourceExpression: expression,
      parameterSemantics: dependencies.parameterSemantics,
    }));
    return Object.freeze({
      variable: input.identity.variable,
      origin: input.correspondence.definitionOrigin,
      semanticResolution,
      source: expression.source,
    });
  },
});
