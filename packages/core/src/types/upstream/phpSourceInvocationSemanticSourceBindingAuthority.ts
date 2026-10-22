import { laravelSourceIdentitySemantics } from './sourceProjectIdentity';
import type { SourceFileIdentityRelationJudgment } from './sourceProjectIdentity';
import type { PhpSourceInvocationSemanticPipelineCompositionEvidence } from './phpSourceInvocationSemanticPipelineInterface';
import type {
  PhpSourceInvocationSemanticSourceBindingAuthorityInterface,
  PhpSourceInvocationSemanticSourceBindingContract,
  PhpSourceInvocationSemanticSourceBindingInput,
  PhpSourceInvocationSemanticSourceBindingJudgment,
} from './phpSourceInvocationSemanticSourceBindingInterface';

export const PHP_SOURCE_INVOCATION_SEMANTIC_SOURCE_BINDING_CONTRACT: PhpSourceInvocationSemanticSourceBindingContract = Object.freeze({
  kind: 'php_source_invocation_semantic_source_binding_contract',
  version: 5,
  identityRule: 'controller-and-pipeline-source-file-identity-is-judged-by-LaravelSourceIdentitySemanticsInterface',
  identityJudgmentPreservation: 'same-or-different-source-file-identity-judgment-is-retained-as-typed-evidence-in-the-binding-outcome',
  sourceEndpointOwnership: 'identity-judgment-owns-the-two-endpoints-of-the-source-relation;an-enclosing-invocation-judgment-may-retain-one-canonical-source-subject-key-but-that-key-is-not-a-substitute-for-or-copy-of-the-provenance-relation',
  publicationRule: 'only-a-closed-source-binding-judgment-may-feed-controller-integrated-response-publication',
  rejectionPreservationRule: 'a-rejected-source-binding-retains-the-exact-original-pipeline-result-and-both-source-identities-through-the-identity-judgment',
  outcomeRule: 'complete-and-blocked-pipeline-results-remain-distinct-and-are-never-reclassified-by-source-binding',
  runtimeRule: 'binding-validates-provenance-only-and-does-not-resolve-invocations-or-synthesize-semantic-judgments',
});

type ClosedSourceBindingJudgment = Extract<
  PhpSourceInvocationSemanticSourceBindingJudgment,
  { readonly kind: 'php_source_invocation_semantic_source_binding_closed' }
>;
type RejectedSourceBindingJudgment = Extract<
  PhpSourceInvocationSemanticSourceBindingJudgment,
  { readonly kind: 'php_source_invocation_semantic_source_binding_rejected' }
>;

const closedBinding = (
  input: PhpSourceInvocationSemanticSourceBindingInput,
  identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }>,
): ClosedSourceBindingJudgment => Object.freeze({
  kind: 'php_source_invocation_semantic_source_binding_closed',
  pipelineResult: input.pipelineResult,
  identityJudgment,
  provenance: 'controller-source-file-matches-whole-file-pipeline-document',
});

const rejectedBinding = (
  input: PhpSourceInvocationSemanticSourceBindingInput,
  identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }>,
): RejectedSourceBindingJudgment => Object.freeze({
  kind: 'php_source_invocation_semantic_source_binding_rejected',
  pipelineResult: input.pipelineResult,
  identityJudgment,
  reason: 'controller-source-and-pipeline-document-identities-differ',
});

const bind = (input: PhpSourceInvocationSemanticSourceBindingInput): PhpSourceInvocationSemanticSourceBindingJudgment => {
  const identityJudgment = laravelSourceIdentitySemantics.relateSourceFiles(
    input.controllerSourceFile,
    input.pipelineResult.document.sourceFile,
  );
  switch (identityJudgment.kind) {
    case 'same_source_file_identity':
      return closedBinding(input, identityJudgment);
    case 'different_source_file_identity':
      return rejectedBinding(input, identityJudgment);
  }
};

export const phpSourceInvocationSemanticSourceBindingAuthority: PhpSourceInvocationSemanticSourceBindingAuthorityInterface = Object.freeze({
  kind: 'php_source_invocation_semantic_source_binding_authority',
  contract: PHP_SOURCE_INVOCATION_SEMANTIC_SOURCE_BINDING_CONTRACT,
  identitySemantics: laravelSourceIdentitySemantics,
  bind,
});

/** Convert the binding judgment into an explicit integrated-response input without changing its outcome. */
export const phpSourceInvocationPipelineEvidenceFromSourceBinding = (
  judgment: PhpSourceInvocationSemanticSourceBindingJudgment,
): Exclude<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }> => {
  switch (judgment.kind) {
    case 'php_source_invocation_semantic_source_binding_closed':
      return Object.freeze({ kind: 'php_source_invocation_pipeline_connected', sourceBinding: judgment });
    case 'php_source_invocation_semantic_source_binding_rejected':
      return Object.freeze({ kind: 'php_source_invocation_pipeline_source_binding_rejected', judgment });
  }
};
