/**
 * Canonical high-level contract for invocation semantic algebra.
 * Internal derivation phases are intentionally not exposed as caller-facing methods.
 */
import type { InvocationSemanticInput, InvocationSemanticJudgment } from './invocationSemanticJudgmentInterface';

/**
 * Domain guarantees of a complete invocation derivation. These are interface
 * obligations; implementation and authority wiring are migrated in later phases.
 */
export interface InvocationSemanticAlgebraBoundaryContract {
  readonly kind: 'invocation_semantic_algebra_boundary_contract';
  readonly version: 1;
  readonly semanticResult: 'derive-one-complete-invocation-domain-judgment';
  readonly sourceEvidence: 'preserve-upstream-evidence-and-never-invent-provenance';
  readonly targetMeaning: 'resolve-target-from-semantic-knowledge-and-preserve-unresolved-or-ambiguous-obligations';
  readonly argumentMeaning: 'bind-only-when-target-and-argument-form-are-established-by-evidence';
  readonly effectMeaning: 'project-only-declared-callable-emissions-with-distinct-result-and-exception-meaning';
  readonly proofMeaning: 'every-derived-claim-is-supported-by-correlated-witness-and-rule-trace';
  readonly closureMeaning: 'closed-only-when-all-applicable-obligations-are-satisfied-and-proof-is-closed';
  readonly partialMeaning: 'preserve-established-facts-and-all-unresolved-obligations-in-incomplete-judgments';
  readonly identityMeaning: 'invocation-target-argument-parameter-emission-and-evidence-identities-must-correlate';
  readonly boundaryMeaning: 'callers-consume-one-domain-judgment-without-driving-internal-derivation-phases';
}

/**
 * One high-level algebra operation. Target resolution, argument binding, effect
 * projection, proof construction, and closure remain internal semantic derivation
 * responsibilities rather than separate low-level public methods.
 */
export interface InvocationSemanticAlgebraBoundaryInterface {
  readonly kind: 'invocation_semantic_algebra_boundary';
  readonly contract: InvocationSemanticAlgebraBoundaryContract;
  readonly derive: (input: InvocationSemanticInput) => InvocationSemanticJudgment;
}

export const INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT: InvocationSemanticAlgebraBoundaryContract = Object.freeze({
  kind: 'invocation_semantic_algebra_boundary_contract',
  version: 1,
  semanticResult: 'derive-one-complete-invocation-domain-judgment',
  sourceEvidence: 'preserve-upstream-evidence-and-never-invent-provenance',
  targetMeaning: 'resolve-target-from-semantic-knowledge-and-preserve-unresolved-or-ambiguous-obligations',
  argumentMeaning: 'bind-only-when-target-and-argument-form-are-established-by-evidence',
  effectMeaning: 'project-only-declared-callable-emissions-with-distinct-result-and-exception-meaning',
  proofMeaning: 'every-derived-claim-is-supported-by-correlated-witness-and-rule-trace',
  closureMeaning: 'closed-only-when-all-applicable-obligations-are-satisfied-and-proof-is-closed',
  partialMeaning: 'preserve-established-facts-and-all-unresolved-obligations-in-incomplete-judgments',
  identityMeaning: 'invocation-target-argument-parameter-emission-and-evidence-identities-must-correlate',
  boundaryMeaning: 'callers-consume-one-domain-judgment-without-driving-internal-derivation-phases',
});
