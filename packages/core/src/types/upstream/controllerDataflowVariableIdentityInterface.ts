import type { SemanticFact, KnowledgeId } from './semanticDataflowKnowledge';
import type { VariableName } from './names';

export interface ControllerDataflowVariableIdentityInput {
  readonly kind: 'controller_dataflow_variable_identity_input';
  readonly identity: KnowledgeId;
  readonly facts: readonly SemanticFact[];
}

/** Closed judgment: an opaque knowledge slot is never silently treated as a source variable name. */
export type ControllerDataflowVariableIdentityJudgment =
  | Readonly<{
      readonly kind: 'controller_dataflow_variable_identity_resolved';
      readonly identity: KnowledgeId;
      readonly variable: VariableName;
      readonly evidence: Extract<SemanticFact, { readonly kind: 'variable' }>['value'];
    }>
  | Readonly<{
      readonly kind: 'controller_dataflow_variable_identity_missing';
      readonly identity: KnowledgeId;
    }>
  | Readonly<{
      readonly kind: 'controller_dataflow_variable_identity_ambiguous';
      readonly identity: KnowledgeId;
      readonly candidates: readonly Extract<SemanticFact, { readonly kind: 'variable' }>['value'][];
    }>;

export interface ControllerDataflowVariableIdentityAuthorityInterface {
  readonly kind: 'controller_dataflow_variable_identity_authority';
  readonly contractVersion: 1;
  readonly resolve: (input: ControllerDataflowVariableIdentityInput) => ControllerDataflowVariableIdentityJudgment;
}
