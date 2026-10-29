import type { ControllerVariableDefinition } from './controller';
import type {
  ControllerDataflowBindingPayloadCorrespondenceJudgment,
  ControllerDataflowDefinitionPayloadMetadata,
  ControllerDataflowSourcePayload,
} from './controllerDataflowBindingPayloadCorrespondenceInterface';
import type {
  ControllerDataflowBindingSemanticJudgmentInterface,
  ControllerDataflowInvocationSemanticModelInterface,
  ControllerDataflowPayloadSemanticJudgment,
} from './controllerDataflowInvocationSemanticModelInterface';
import type { ControllerDataflowVariableIdentityAuthorityInterface, ControllerDataflowVariableIdentityJudgment } from './controllerDataflowVariableIdentityInterface';
import type { ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface } from './controllerDataflowBindingPayloadCorrespondenceInterface';
import type { ControllerSemanticVariableFlowCompositionAuthorityInterface } from './controllerSemanticVariableFlowCompositionInterface';
import type { SemanticKnowledgeEvidenceProjection } from './semanticKnowledgeEvidenceAdapterInterface';
import type { SourceFile } from './names';
import type { SemanticBinding, SemanticKnowledgeDataFlow } from './semanticDataflowKnowledge';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { InvocationSemanticIntegratedResponseCompositionInterface } from './invocationSemanticPipelineInterface';
import type { LaravelSourceIdentitySemanticsInterface } from './sourceProjectIdentity';


export interface ControllerDataflowDefinitionProjectionInput<Binding, Payload> {
  readonly kind: 'controller_dataflow_definition_projection_input';
  readonly correspondence: Extract<
    ControllerDataflowBindingPayloadCorrespondenceJudgment<Binding, Payload>,
    { readonly kind: 'binding_payload_correspondence_matched' }
  >;
  readonly identity: Extract<
    ControllerDataflowVariableIdentityJudgment,
    { readonly kind: 'controller_dataflow_variable_identity_resolved' }
  >;
}

/** Source-language adapter: projects a proven binding/identity pair into the canonical definition domain. */
export interface ControllerDataflowDefinitionProjectionAuthorityInterface<Binding, Payload> {
  readonly kind: 'controller_dataflow_definition_projection_authority';
  readonly project: (input: ControllerDataflowDefinitionProjectionInput<Binding, Payload>) => ControllerVariableDefinition;
  readonly sourceBinding: 'definition-expression-projection-uses-the-exact-matched-payload-source-file-after-authority-source-identity-closure;the-binding-judgment-retains-the-payload-source-span-as-provenance';
}

/**
 * One source-correlated evidence package. The scanner creates this value from the
 * canonical invocation judgment before crossing the semantic-authority boundary,
 * so callers cannot independently swap the three evidence inputs at that boundary.
 */
export interface ControllerDataflowSourceCorrelationInterface<
  Payload extends ControllerDataflowDefinitionPayloadMetadata,
> {
  readonly kind: 'controller_dataflow_source_correlation';
  readonly sourceFile: SourceFile;
  readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;
  readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection & Readonly<{ readonly knowledge: SemanticKnowledgeDataFlow }>;
  readonly statementPayloads: readonly ControllerDataflowSourcePayload<Payload>[];
}

export interface ControllerDataflowSemanticJudgmentAuthorityInput<
  Payload extends ControllerDataflowDefinitionPayloadMetadata,
> {
  readonly kind: 'controller_dataflow_semantic_judgment_authority_input';
  /** Source identity, invocation outcome, knowledge projection, and payload evidence cross as one contract value. */
  readonly sourceCorrelation: ControllerDataflowSourceCorrelationInterface<Payload>;
  readonly definitionProjectionAuthority: ControllerDataflowDefinitionProjectionAuthorityInterface<SemanticBinding, Payload>;
}


/** Authority-produced closed judgment; the invocation response remains a separate field within the same result. */
export interface ControllerDataflowSemanticJudgment<
  Payload extends ControllerDataflowDefinitionPayloadMetadata,
> extends ControllerDataflowInvocationSemanticModelInterface<
  ControllerDataflowBindingSemanticJudgmentInterface<SemanticBinding, Payload>,
  ControllerDataflowPayloadSemanticJudgment<Payload, ControllerDataflowBindingSemanticJudgmentInterface<SemanticBinding, Payload>>
> {
  readonly kind: 'controller_dataflow_semantic_judgment';
}

/**
 * Complete upstream owner of controller dataflow semantic closure. It correlates every knowledge
 * binding with source correspondence, variable identity, and a definition only when resolved.
 * Invocation judgment and integrated response remain distinct values in the resulting model.
 */
export interface ControllerDataflowSemanticJudgmentAuthorityInterface {
  readonly kind: 'controller_dataflow_semantic_judgment_authority';
  readonly contractVersion: 17;
  /** Existing semantic operations are injected by their owning upstream contracts, not captured as module singletons. */
  readonly bindingPayloadCorrespondenceAuthority: ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface;
  readonly variableIdentityAuthority: ControllerDataflowVariableIdentityAuthorityInterface;
  readonly variableFlowCompositionAuthority: ControllerSemanticVariableFlowCompositionAuthorityInterface;
  readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface;
  /** The exact integrated-response composition operation is an explicit dependency, not a hidden singleton call. */
  readonly integratedResponseComposition: InvocationSemanticIntegratedResponseCompositionInterface;
  readonly derive: <Payload extends ControllerDataflowDefinitionPayloadMetadata>(
    input: ControllerDataflowSemanticJudgmentAuthorityInput<Payload>,
  ) => ControllerDataflowSemanticJudgment<Payload>;
}

/** Explicit dependency value used to construct the controller dataflow authority. */
export interface ControllerDataflowSemanticJudgmentAuthorityDependencies {
  readonly bindingPayloadCorrespondenceAuthority: ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface;
  readonly variableIdentityAuthority: ControllerDataflowVariableIdentityAuthorityInterface;
  readonly variableFlowCompositionAuthority: ControllerSemanticVariableFlowCompositionAuthorityInterface;
  readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface;
  readonly integratedResponseComposition: InvocationSemanticIntegratedResponseCompositionInterface;
}

/** Domain-owned constructor; consumers depend on this interface instead of an exported parameterized function. */
export interface ControllerDataflowSemanticJudgmentAuthorityFactoryInterface {
  readonly kind: 'controller_dataflow_semantic_judgment_authority_factory';
  readonly create: (
    dependencies: ControllerDataflowSemanticJudgmentAuthorityDependencies,
  ) => ControllerDataflowSemanticJudgmentAuthorityInterface;
}

export interface ControllerDataflowSemanticJudgmentAuthorityContract {
  readonly kind: 'controller_dataflow_semantic_judgment_authority_contract';
  readonly version: 17;
  readonly dependencyOwnership: 'all-existing-correspondence-identity-flow-source-identity-and-integrated-response-operations-are-explicitly-injected';
  readonly integratedResponseOwnership: 'authority-uses-the-exact-injected-integrated-response-composition-operation';
  readonly sourceCorrelation: 'one-canonical-sourceFile-is-validated-against-the-invocation-judgment-and-knowledge-projection-through-LaravelSourceIdentitySemantics-before-binding-identity-flow-or-integrated-response-publication';
  readonly semanticOwnership: 'upstream-authority-owns-binding-correspondence-identity-closure-variable-flow-and-integrated-response-composition';
  readonly evidenceOwnership: 'scanner-adapters-only-collect-source-correlated-knowledge-and-parser-payload-evidence';
  readonly unresolvedOutcomes: 'missing-and-ambiguous-correspondence-or-identity-remain-explicit-in-each-binding-judgment';
  readonly definitionRule: 'canonical-definition-exists-only-for-matched-correspondence-and-resolved-variable-identity';
  readonly knowledgeOwnership: 'composition-receives-the-complete-source-correlated-semanticKnowledgeProjection;inventory-and-analysis-consume-its-canonical-knowledge;response-only-result-does-not-republish-knowledge-or-provenance';
  readonly invocationOwnership: 'retain-the-exact-invocation-judgment-and-a-separate-integrated-response-composition-result';
  readonly analyzerRole: 'bind-one-canonical-invocation-source-subject-package-all-source-evidence-as-one-correlation-value-call-one-closed-authority-and-forward-the-complete-judgment';
  readonly sourceIdentityClosure: 'upstream-authority-validates-canonical-subject-against-invocation-judgment-and-knowledge-projection-using-the-existing-typed-source-file-relation;malformed-correlation-is-rejected-before-semantic-closure';
  readonly definitionProjectionSourceBinding: 'definition-projector-consumes-the-matched-correspondence-payload-source-file-not-a-second-invocation-judgment-source-channel;resolved-binding-judgment-retains-the-exact-correspondence-and-payload-provenance';
  readonly payloadSourceIdentityClosure: 'every-statement-payload-source-span-file-must-relate-to-the-canonical-sourceFile-through-the-existing-typed-source-file-identity-judgment-before-binding-correspondence-or-integrated-response-composition';
  readonly semanticResolutionExpressionBinding: 'the-existing-upstream-semantic-resolution-request-and-every-closed-judgment-retain-the-exact-canonical-Expression-projected-from-the-same-matched-payload-that-produced-syntax-neutral-evidence;the-judgment-is-not-reconstructed-from-expressionValue';
  readonly definitionProvenanceClosure: 'every-resolved-definition-source-file-must-relate-to-the-canonical-sourceFile-after-projection-and-before-the-definition-enters-variable-flow-or-integrated-response-publication;the-definition-retains-the-exact-closed-semantic-resolution-judgment';
  readonly semanticJudgmentPublicationClosure: 'definition-expression-is-not-duplicated-outside-the-closed-semanticResolution-judgment-before-integrated-response-publication';
  readonly payloadSemanticJudgmentClosure: 'the-authority-publishes-one-closed-outcome-per-source-payload;duplicate-resolved-binding-candidates-are-ambiguous-not-first-match-selected';
}

export const CONTROLLER_DATAFLOW_SEMANTIC_JUDGMENT_AUTHORITY_CONTRACT: ControllerDataflowSemanticJudgmentAuthorityContract = Object.freeze({
  kind: 'controller_dataflow_semantic_judgment_authority_contract',
  version: 17,
  dependencyOwnership: 'all-existing-correspondence-identity-flow-source-identity-and-integrated-response-operations-are-explicitly-injected',
  integratedResponseOwnership: 'authority-uses-the-exact-injected-integrated-response-composition-operation',
  sourceCorrelation: 'one-canonical-sourceFile-is-validated-against-the-invocation-judgment-and-knowledge-projection-through-LaravelSourceIdentitySemantics-before-binding-identity-flow-or-integrated-response-publication',
  semanticOwnership: 'upstream-authority-owns-binding-correspondence-identity-closure-variable-flow-and-integrated-response-composition',
  evidenceOwnership: 'scanner-adapters-only-collect-source-correlated-knowledge-and-parser-payload-evidence',
  unresolvedOutcomes: 'missing-and-ambiguous-correspondence-or-identity-remain-explicit-in-each-binding-judgment',
  definitionRule: 'canonical-definition-exists-only-for-matched-correspondence-and-resolved-variable-identity',
  knowledgeOwnership: 'composition-receives-the-complete-source-correlated-semanticKnowledgeProjection;inventory-and-analysis-consume-its-canonical-knowledge;response-only-result-does-not-republish-knowledge-or-provenance',
  invocationOwnership: 'retain-the-exact-invocation-judgment-and-a-separate-integrated-response-composition-result',
  analyzerRole: 'bind-one-canonical-invocation-source-subject-package-all-source-evidence-as-one-correlation-value-call-one-closed-authority-and-forward-the-complete-judgment',
  sourceIdentityClosure: 'upstream-authority-validates-canonical-subject-against-invocation-judgment-and-knowledge-projection-using-the-existing-typed-source-file-relation;malformed-correlation-is-rejected-before-semantic-closure',
  definitionProjectionSourceBinding: 'definition-projector-consumes-the-matched-correspondence-payload-source-file-not-a-second-invocation-judgment-source-channel;resolved-binding-judgment-retains-the-exact-correspondence-and-payload-provenance',
  payloadSourceIdentityClosure: 'every-statement-payload-source-span-file-must-relate-to-the-canonical-sourceFile-through-the-existing-typed-source-file-identity-judgment-before-binding-correspondence-or-integrated-response-composition',
  semanticResolutionExpressionBinding: 'the-existing-upstream-semantic-resolution-request-and-every-closed-judgment-retain-the-exact-canonical-Expression-projected-from-the-same-matched-payload-that-produced-syntax-neutral-evidence;the-judgment-is-not-reconstructed-from-expressionValue',
  definitionProvenanceClosure: 'every-resolved-definition-source-file-must-relate-to-the-canonical-sourceFile-after-projection-and-before-the-definition-enters-variable-flow-or-integrated-response-publication;the-definition-retains-the-exact-closed-semantic-resolution-judgment',
  semanticJudgmentPublicationClosure: 'definition-expression-is-not-duplicated-outside-the-closed-semanticResolution-judgment-before-integrated-response-publication',
  payloadSemanticJudgmentClosure: 'the-authority-publishes-one-closed-outcome-per-source-payload;duplicate-resolved-binding-candidates-are-ambiguous-not-first-match-selected',
});
