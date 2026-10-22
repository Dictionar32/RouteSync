import type { ControllerSemanticVariableFlow, ControllerVariableDefinition } from './controller';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { InvocationSemanticIntegratedResponseCompositionResult } from './invocationSemanticPipelineInterface';
import type { SemanticKnowledgeEvidenceProjection } from './semanticKnowledgeEvidenceAdapterInterface';
import type { ControllerDataflowBindingPayloadCorrespondenceJudgment, ControllerDataflowDefinitionPayloadMetadata, ControllerDataflowSourcePayload } from './controllerDataflowBindingPayloadCorrespondenceInterface';
import type { ControllerDataflowVariableIdentityJudgment } from './controllerDataflowVariableIdentityInterface';

/**
 * Binding-level closure keeps correspondence and identity outcomes correlated.
 * A missing/ambiguous correspondence is a closed outcome; identity is not fabricated
 * for a binding whose source payload could not be established.
 */
export type ControllerDataflowBindingSemanticJudgmentInterface<Binding, Payload> =
  | Readonly<{
      readonly kind: 'controller_dataflow_binding_correspondence_unresolved';
      readonly correspondence: Extract<
        ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload>,
        { readonly kind: 'binding_payload_correspondence_missing' | 'binding_payload_correspondence_ambiguous' }
      >;
    }>
  | Readonly<{
      readonly kind: 'controller_dataflow_binding_identity_unresolved';
      readonly correspondence: Extract<
        ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload>,
        { readonly kind: 'binding_payload_correspondence_matched' }
      >;
      readonly identity: Extract<
        ControllerDataflowVariableIdentityJudgment,
        { readonly kind: 'controller_dataflow_variable_identity_missing' | 'controller_dataflow_variable_identity_ambiguous' }
      >;
    }>
  | Readonly<{
      readonly kind: 'controller_dataflow_binding_semantics_resolved';
      readonly correspondence: Extract<
        ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload>,
        { readonly kind: 'binding_payload_correspondence_matched' }
      >;
      readonly identity: Extract<
        ControllerDataflowVariableIdentityJudgment,
        { readonly kind: 'controller_dataflow_variable_identity_resolved' }
      >;
      readonly definition: ControllerVariableDefinition;
    }>;


/**
 * One closed semantic outcome per exact source payload. Multiple resolved bindings
 * for one payload are explicit ambiguity, never resolved by choosing the first one.
 */
export type ControllerDataflowPayloadSemanticJudgment<Payload extends ControllerDataflowDefinitionPayloadMetadata, BindingJudgment> =
  | Readonly<{
      readonly kind: 'controller_dataflow_payload_semantics_unresolved';
      readonly payload: ControllerDataflowSourcePayload<Payload>;
    }>
  | Readonly<{
      readonly kind: 'controller_dataflow_payload_semantics_resolved';
      readonly payload: ControllerDataflowSourcePayload<Payload>;
      readonly bindingJudgment: Extract<BindingJudgment, { readonly kind: 'controller_dataflow_binding_semantics_resolved' }> ;
    }>
  | Readonly<{
      readonly kind: 'controller_dataflow_payload_semantics_ambiguous';
      readonly payload: ControllerDataflowSourcePayload<Payload>;
      readonly bindingJudgments: readonly Extract<BindingJudgment, { readonly kind: 'controller_dataflow_binding_semantics_resolved' }>[];
    }>;

/**
 * Closed data model shared by Laravel controller AST projection and downstream consumers.
 * This is a semantic value contract, not a callable authority or a second invocation judgment.
 */
export interface ControllerDataflowInvocationSemanticModelInterface<
  TBindingJudgment = never,
  TPayloadJudgment = never,
> {
  /** Canonical upstream semantic variable flow; source AST remains evidence only. */
  readonly semanticVariables: ControllerSemanticVariableFlow;
  /** One correlated outcome per knowledge binding; no parallel uncorrelated result arrays. */
  readonly bindingJudgments: readonly TBindingJudgment[];
  /** One authority-closed outcome per exact source payload, including ambiguity. */
  readonly payloadJudgments: readonly TPayloadJudgment[];
  /** Evidence provenance and canonical source identity travel with the knowledge model. */
  readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection;
  /** Composition aggregate retains the publication result and original PHP invocation outcome. */
  readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;
  /** Exact source-correlated judgment; its source identity is not reconstructed from a path string. */
  readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;
}

/** Ownership rules for the controller dataflow semantic model. */
export interface ControllerDataflowInvocationSemanticModelContract {
  readonly kind: 'controller_dataflow_invocation_semantic_model_contract';
  readonly version: 18;
  readonly canonicalJudgment: 'retain-the-exact-upstream-controller-invocation-judgment-with-its-discriminated-response-outcome';
  readonly integratedResponse: 'retain-the-integrated-response-from-the-knowledge-bound-composition-without-republishing-knowledge';
  readonly knowledgeIdentity: 'semanticKnowledgeProjection.knowledge-is-the-only-published-canonical-knowledge-value;composition-consumes-it-but-its-result-does-not-repeat-it';
  readonly evidenceProjectionOwnership: 'the-controller-dataflow-model-retains-the-source-correlated-knowledge-projection-and-its-provider-provenance-as-part-of-the-same-semantic-value-contract';
  readonly semanticResolutionExpressionBinding: 'each-definition-semanticResolution-retains-the-exact-canonical-expression-projected-from-the-matched-payload-that-generated-its-syntax-neutral-semantic-evidence';
  readonly semanticJudgmentPublication: 'variable-flow-composition-publishes-definitions-whose-single-canonical-expression-is-owned-by-the-closed-semanticResolution-judgment-before-integrated-response-publication';
  readonly sourceIdentity: 'the-upstream-authority-validates-the-canonical-sourceFile-against-the-invocation-judgment-knowledge-projection-and-every-statement-payload-source-span-before-publishing-the-model;definition-expression-projection-consumes-the-exact-matched-payload-source-file-and-the-binding-judgment-retains-that-payload-provenance;projected-definition-source-file-is-validated-against-the-canonical-source-before-variable-flow-publication;no-path-based-identity-reconstruction';
  readonly noParallelAuthority: 'this-model-is-a-value-contract-and-does-not-introduce-a-second-callable-semantic-authority';
  readonly bindingClosure: 'each-knowledge-binding-retains-one-correlated-correspondence-outcome-and-when-matched-an-explicit-identity-outcome-and-definition-only-when-resolved';
  readonly payloadJudgmentClosure: 'each-exact-source-payload-receives-one-closed-semantic-outcome;multiple-resolved-bindings-for-one-payload-are-explicitly-ambiguous-and-never-first-match-selected';
  readonly variableSemanticReasoningClosure: 'controller-variable-reasoning-rules-are-declared-as-a-closed-upstream-ADT-contract;duplicate-matching-parameter-bindings-produce-an-ambiguous-judgment-and-are-never-first-match-selected;the-exact-sourceExpression-remains-on-every-judgment';
  readonly astAdtProjection: 'the-AST-expression-projector-exhaustively-consumes-the-closed-payload-judgment-ADT;resolved-reuses-the-canonical-sourceExpression;unresolved-and-ambiguous-remain-distinct-SemanticValue-outcomes;ControllerBodyAst-is-a-discriminated-syntax-only-or-semantic-ADT;syntax-only-has-no-dataflow-and-semantic-body-retains-the-canonical-judgment;no-consumer-selects-a-candidate-from-bindingJudgments';
  readonly semanticBodyInvocationOutcome: 'controller_body_semantic-means-the-canonical-dataflow-judgment-is-present-not-that-the-invocation-pipeline-is-complete;the-exact-invocationJudgment-and-integrated-response-preserve-complete-blocked-source-binding-rejected-and-not-connected-as-distinct-outcomes';
  readonly consumerClosure: 'AST-expression-projection-consumes-payloadJudgments-by-exact-source-payload-identity;resource-binding-projection-consumes-the-canonical-semanticVariables-flow-through-its-domain-authority;no-production-consumer-reselects-bindingJudgments-or-reconstructs-integrated-response';
  readonly noDuplicateKnowledgeField: 'neither-the-model-nor-the-nested-composition-result-publishes-a-second-knowledge-field';
  readonly noIndependentOutcomeArrays: 'correspondence-identity-and-definition-outcomes-are-correlated-in-one-binding-judgment-not-parallel-arrays';
}

export const CONTROLLER_DATAFLOW_INVOCATION_SEMANTIC_MODEL_CONTRACT: ControllerDataflowInvocationSemanticModelContract = Object.freeze({
  kind: 'controller_dataflow_invocation_semantic_model_contract',
  version: 18,
  canonicalJudgment: 'retain-the-exact-upstream-controller-invocation-judgment-with-its-discriminated-response-outcome',
  integratedResponse: 'retain-the-integrated-response-from-the-knowledge-bound-composition-without-republishing-knowledge',
  knowledgeIdentity: 'semanticKnowledgeProjection.knowledge-is-the-only-published-canonical-knowledge-value;composition-consumes-it-but-its-result-does-not-repeat-it',
  evidenceProjectionOwnership: 'the-controller-dataflow-model-retains-the-source-correlated-knowledge-projection-and-its-provider-provenance-as-part-of-the-same-semantic-value-contract',
  semanticResolutionExpressionBinding: 'each-definition-semanticResolution-retains-the-exact-canonical-expression-projected-from-the-matched-payload-that-generated-its-syntax-neutral-semantic-evidence',
  semanticJudgmentPublication: 'variable-flow-composition-publishes-definitions-whose-single-canonical-expression-is-owned-by-the-closed-semanticResolution-judgment-before-integrated-response-publication',
  sourceIdentity: 'the-upstream-authority-validates-the-canonical-sourceFile-against-the-invocation-judgment-knowledge-projection-and-every-statement-payload-source-span-before-publishing-the-model;definition-expression-projection-consumes-the-exact-matched-payload-source-file-and-the-binding-judgment-retains-that-payload-provenance;projected-definition-source-file-is-validated-against-the-canonical-source-before-variable-flow-publication;no-path-based-identity-reconstruction',
  noParallelAuthority: 'this-model-is-a-value-contract-and-does-not-introduce-a-second-callable-semantic-authority',
  bindingClosure: 'each-knowledge-binding-retains-one-correlated-correspondence-outcome-and-when-matched-an-explicit-identity-outcome-and-definition-only-when-resolved',
  payloadJudgmentClosure: 'each-exact-source-payload-receives-one-closed-semantic-outcome;multiple-resolved-bindings-for-one-payload-are-explicitly-ambiguous-and-never-first-match-selected',
  variableSemanticReasoningClosure: 'controller-variable-reasoning-rules-are-declared-as-a-closed-upstream-ADT-contract;duplicate-matching-parameter-bindings-produce-an-ambiguous-judgment-and-are-never-first-match-selected;the-exact-sourceExpression-remains-on-every-judgment',
  astAdtProjection: 'the-AST-expression-projector-exhaustively-consumes-the-closed-payload-judgment-ADT;resolved-reuses-the-canonical-sourceExpression;unresolved-and-ambiguous-remain-distinct-SemanticValue-outcomes;ControllerBodyAst-is-a-discriminated-syntax-only-or-semantic-ADT;syntax-only-has-no-dataflow-and-semantic-body-retains-the-canonical-judgment;no-consumer-selects-a-candidate-from-bindingJudgments',
  semanticBodyInvocationOutcome: 'controller_body_semantic-means-the-canonical-dataflow-judgment-is-present-not-that-the-invocation-pipeline-is-complete;the-exact-invocationJudgment-and-integrated-response-preserve-complete-blocked-source-binding-rejected-and-not-connected-as-distinct-outcomes',
  consumerClosure: 'AST-expression-projection-consumes-payloadJudgments-by-exact-source-payload-identity;resource-binding-projection-consumes-the-canonical-semanticVariables-flow-through-its-domain-authority;no-production-consumer-reselects-bindingJudgments-or-reconstructs-integrated-response',
  noDuplicateKnowledgeField: 'neither-the-model-nor-the-nested-composition-result-publishes-a-second-knowledge-field',
  noIndependentOutcomeArrays: 'correspondence-identity-and-definition-outcomes-are-correlated-in-one-binding-judgment-not-parallel-arrays',
});
