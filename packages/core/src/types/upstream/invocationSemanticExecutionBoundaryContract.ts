/**
 * Canonical cross-boundary contracts for invocation semantic authority and runtime execution.
 * These contracts settle ownership before implementations are wired to them.
 */
import { INVOCATION_SEMANTIC_CONTRACT } from './invocationSemanticJudgmentInterface';
import type { InvocationSemanticContract } from './invocationSemanticJudgmentInterface';
import { INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT } from './invocationSemanticAlgebraBoundaryInterface';
import type { InvocationSemanticAlgebraBoundaryContract } from './invocationSemanticAlgebraBoundaryInterface';

/** Authority owns validation of the judgment produced by the canonical domain algebra. */
export interface InvocationSemanticAuthorityBoundaryContract {
  readonly kind: 'invocation_semantic_authority_boundary_contract';
  readonly version: 2;
  readonly judgment: InvocationSemanticContract;
  readonly algebra: InvocationSemanticAlgebraBoundaryContract;
  readonly derivationOwnership: 'domain-algebra-derives-the-judgment-authority-does-not-rederive-meaning';
  readonly validationOwnership: 'authority-validates-identity-evidence-proof-obligations-and-closure-before-return';
  readonly invalidResult: 'reject-before-runtime-or-downstream-consumption';
  readonly evidenceOwnership: 'only-upstream-source-backed-evidence-may-support-semantic-claims';
  readonly incompleteResult: 'preserve-proven-claims-and-explicit-unresolved-obligations';
  /** The judgment's invocation and every proof component stay bound to the exact request. */
  readonly requestedSubjectBinding: 'returned-judgment-invocation-and-every-trace-witness-and-obligation-must-remain-bound-to-the-requested-invocation-and-source-evidence';
  /** Authority validates the algebra result; it does not become a second semantic derivation engine. */
  readonly derivationSeparation: 'validate-the-algebra-produced-judgment-without-rederiving-reclassifying-or-repairing-semantic-meaning';
  /** A failed invariant is a rejection, not an alternate judgment fabricated by runtime. */
  readonly rejectionSemantics: 'reject-invalid-authority-output-before-runtime-or-downstream-consumption-without-fallback-judgment';
}

export const INVOCATION_SEMANTIC_AUTHORITY_BOUNDARY_CONTRACT: InvocationSemanticAuthorityBoundaryContract = Object.freeze({
  kind: 'invocation_semantic_authority_boundary_contract',
  version: 2,
  judgment: INVOCATION_SEMANTIC_CONTRACT,
  algebra: INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT,
  derivationOwnership: 'domain-algebra-derives-the-judgment-authority-does-not-rederive-meaning',
  validationOwnership: 'authority-validates-identity-evidence-proof-obligations-and-closure-before-return',
  invalidResult: 'reject-before-runtime-or-downstream-consumption',
  evidenceOwnership: 'only-upstream-source-backed-evidence-may-support-semantic-claims',
  incompleteResult: 'preserve-proven-claims-and-explicit-unresolved-obligations',
  requestedSubjectBinding: 'returned-judgment-invocation-and-every-trace-witness-and-obligation-must-remain-bound-to-the-requested-invocation-and-source-evidence',
  derivationSeparation: 'validate-the-algebra-produced-judgment-without-rederiving-reclassifying-or-repairing-semantic-meaning',
  rejectionSemantics: 'reject-invalid-authority-output-before-runtime-or-downstream-consumption-without-fallback-judgment',
});

/** Runtime executor is a pure delegation boundary; its aggregate operation is distinct from per-input batching. */
export interface InvocationSemanticRuntimeExecutorContract {
  readonly kind: 'invocation_semantic_runtime_executor_contract';
  readonly version: 1;
  readonly authority: InvocationSemanticAuthorityBoundaryContract;
  readonly singleExecution: 'delegate-one-input-to-authority-and-return-the-same-validated-judgment';
  readonly aggregateExecution: 'delegate-complete-knowledge-analysis-and-preserve-per-invocation-judgments';
  readonly forbiddenResponsibilities: readonly [
    'target-resolution',
    'argument-binding',
    'effect-projection',
    'proof-synthesis',
    'obligation-invention',
    'judgment-closure',
  ];
  readonly errorMeaning: 'propagate-authority-rejection-without-fabricating-a-semantic-judgment';
}

export const INVOCATION_SEMANTIC_RUNTIME_EXECUTOR_CONTRACT: InvocationSemanticRuntimeExecutorContract = Object.freeze({
  kind: 'invocation_semantic_runtime_executor_contract',
  version: 1,
  authority: INVOCATION_SEMANTIC_AUTHORITY_BOUNDARY_CONTRACT,
  singleExecution: 'delegate-one-input-to-authority-and-return-the-same-validated-judgment',
  aggregateExecution: 'delegate-complete-knowledge-analysis-and-preserve-per-invocation-judgments',
  forbiddenResponsibilities: Object.freeze([
    'target-resolution',
    'argument-binding',
    'effect-projection',
    'proof-synthesis',
    'obligation-invention',
    'judgment-closure',
  ] as const),
  errorMeaning: 'propagate-authority-rejection-without-fabricating-a-semantic-judgment',
});
