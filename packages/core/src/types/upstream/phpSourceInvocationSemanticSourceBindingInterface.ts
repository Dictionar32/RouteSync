import type { SourceFile } from './names';
import type { PhpSourceInvocationSemanticPipelineCompositionEvidence, PhpSourceInvocationSemanticPipelineResult } from './phpSourceInvocationSemanticPipelineInterface';
import type { SourceFileIdentityRelationJudgment, LaravelSourceIdentitySemanticsInterface } from './sourceProjectIdentity';

/** A controller-file identity and the whole-file semantic pipeline result must be bound before publication. */
export type PhpSourceInvocationSemanticSourceBindingInput = Readonly<{
  readonly controllerSourceFile: SourceFile;
  readonly pipelineResult: PhpSourceInvocationSemanticPipelineResult;
}>;

export type PhpSourceInvocationSemanticSourceBindingClosed = Readonly<{
  readonly kind: 'php_source_invocation_semantic_source_binding_closed';
  /** The identity judgment is the sole owner of the bound source identity; the pipeline document retains its exact source file. */
  readonly pipelineResult: PhpSourceInvocationSemanticPipelineResult;
  readonly identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }>;
  readonly provenance: 'controller-source-file-matches-whole-file-pipeline-document';
}> & PhpSourceInvocationSemanticSourceBindingTerminalOperations;

export type PhpSourceInvocationSemanticSourceBindingRejected = Readonly<{
  readonly kind: 'php_source_invocation_semantic_source_binding_rejected';
  /** The identity judgment owns both exact source endpoints; no duplicated source aliases may disagree with it. */
  /** The exact rejected pipeline payload remains available; rejection must not erase the evidence being rejected. */
  readonly pipelineResult: PhpSourceInvocationSemanticPipelineResult;
  readonly identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }>;
  readonly reason: 'controller-source-and-pipeline-document-identities-differ';
}> & PhpSourceInvocationSemanticSourceBindingTerminalOperations;

/** Source binding owns the domain projection that carries its provenance into pipeline composition. */
export interface PhpSourceInvocationSemanticSourceBindingTerminalOperations {
  readonly toPipelineCompositionEvidence: () => Exclude<
    PhpSourceInvocationSemanticPipelineCompositionEvidence,
    { readonly kind: 'php_source_invocation_pipeline_not_connected' }
  >;
}

export type PhpSourceInvocationSemanticSourceBindingJudgment =
  | PhpSourceInvocationSemanticSourceBindingClosed
  | PhpSourceInvocationSemanticSourceBindingRejected;

/** Interface-first projection from a source-binding ADT to pipeline integration evidence. */
export interface PhpSourceInvocationPipelineEvidenceFromSourceBindingInterface {
  readonly project: (
    judgment: PhpSourceInvocationSemanticSourceBindingJudgment,
  ) => Exclude<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>;
}

export interface PhpSourceInvocationSemanticSourceBindingContract {
  readonly kind: 'php_source_invocation_semantic_source_binding_contract';
  readonly version: 6;
  readonly identityRule: 'controller-and-pipeline-source-file-identity-is-judged-by-LaravelSourceIdentitySemanticsInterface';
  readonly identityJudgmentPreservation: 'same-or-different-source-file-identity-judgment-is-retained-as-typed-evidence-in-the-binding-outcome';
  readonly sourceEndpointOwnership: 'identity-judgment-owns-the-two-endpoints-of-the-source-relation;an-enclosing-invocation-judgment-may-retain-one-canonical-source-subject-key-but-that-key-is-not-a-substitute-for-or-copy-of-the-provenance-relation';
  readonly publicationRule: 'only-a-closed-source-binding-judgment-may-feed-controller-integrated-response-publication';
  readonly rejectionPreservationRule: 'a-rejected-source-binding-retains-the-exact-original-pipeline-result-and-both-source-identities-through-the-identity-judgment';
  readonly outcomeRule: 'complete-and-blocked-pipeline-results-remain-distinct-and-are-never-reclassified-by-source-binding';
  readonly runtimeRule: 'binding-validates-provenance-only-and-does-not-resolve-invocations-or-synthesize-semantic-judgments';
}

export interface PhpSourceInvocationSemanticSourceBindingAuthorityInterface {
  readonly kind: 'php_source_invocation_semantic_source_binding_authority';
  readonly contract: PhpSourceInvocationSemanticSourceBindingContract;
  readonly identitySemantics: LaravelSourceIdentitySemanticsInterface;
  readonly bind: (input: PhpSourceInvocationSemanticSourceBindingInput) => PhpSourceInvocationSemanticSourceBindingJudgment;
}
