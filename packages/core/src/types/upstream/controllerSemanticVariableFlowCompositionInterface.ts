import type { ControllerSemanticVariableFlow, ControllerVariableDefinition } from './controller';

export interface ControllerSemanticVariableFlowCompositionInput {
  readonly kind: 'controller_semantic_variable_flow_composition_input';
  /** Definitions already carry canonical variable identity, origin, source span, and semantic judgment. */
  readonly definitions: readonly ControllerVariableDefinition[];
}

export type ControllerSemanticVariableFlowCompositionJudgment =
  | Readonly<{
      readonly kind: 'controller_semantic_variable_flow_composed';
      readonly flow: ControllerSemanticVariableFlow;
      readonly definitionEvidence: readonly ControllerVariableDefinition[];
      readonly closure: 'all-definitions-retained-and-grouped-by-canonical-variable-identity-in-source-order';
      readonly expressionOwnership: 'each-definition-has-one-canonical-expression-owned-by-its-semanticResolution-judgment';
    }>
  | Readonly<{
      readonly kind: 'controller_semantic_variable_flow_empty';
      readonly flow: ControllerSemanticVariableFlow;
      readonly definitionEvidence: readonly ControllerVariableDefinition[];
      readonly closure: 'no-definitions-were-supplied';
      readonly expressionOwnership: 'no-definition-is-published';
    }>;

/** Upstream owner of the canonical variable-flow aggregate; not a PHP AST or scanner-runtime contract. */
export interface ControllerSemanticVariableFlowCompositionAuthorityInterface {
  readonly kind: 'controller_semantic_variable_flow_composition_authority';
  readonly contractVersion: 3;
  readonly expressionOwnership: 'definition-does-not-duplicate-expression-outside-the-closed-semanticResolution-judgment';
  readonly compose: (input: ControllerSemanticVariableFlowCompositionInput) => ControllerSemanticVariableFlowCompositionJudgment;
}
