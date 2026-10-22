import type { PhpSourceInvocationSemanticPipelineIntegrationResult } from './phpSourceInvocationSemanticPipelineIntegrationInterface';
import type { SemanticKnowledgeEvidenceProjection } from './semanticKnowledgeEvidenceAdapterInterface';

/** Scanner-facing input is already authority-integrated; raw source evidence stops upstream. */
export type InvocationPhpSourceIntegratedResponse = PhpSourceInvocationSemanticPipelineIntegrationResult;
/**
 * High-level invocation semantic pipeline contract.
 *
 * This is the public boundary for the currently implemented ordinary-invocation
 * analysis. The static-invocation stage interfaces below describe a separate,
 * contract-only domain until its algebra, authority, coverage publication, and
 * Laravel wiring are implemented. Their existence must not imply static coverage.
 */
import { INVOCATION_SEMANTIC_CONTRACT } from './invocationSemanticJudgmentInterface';
import type {
  InvocationSemanticContract,
  InvocationSemanticInput,
  InvocationSemanticAnalysis,
  InvocationSemanticJudgment,
  InvocationSemanticAuthorityInterface,
  SemanticInterproceduralDataFlowAuthorityInterface,
} from './invocationSemanticJudgmentInterface';
import type { KnowledgeId, SemanticCallable, SemanticEmission, SemanticInvocation, SemanticKnowledgeDataFlow, SemanticSource, SemanticStaticInvocation } from './semanticDataflowKnowledge';
import { INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT } from './invocationSemanticAlgebraBoundaryInterface';
import type { InvocationSemanticAlgebraBoundaryContract } from './invocationSemanticAlgebraBoundaryInterface';
import {
  INVOCATION_SEMANTIC_AUTHORITY_BOUNDARY_CONTRACT,
} from './invocationSemanticExecutionBoundaryContract';
import type {
  InvocationSemanticAuthorityBoundaryContract,
} from './invocationSemanticExecutionBoundaryContract';

/** One invocation's validated semantic result, preserving its source identity. */
export interface InvocationSemanticPipelineEntry {
  readonly invocation: SemanticInvocation;
  readonly judgment: InvocationSemanticJudgment;
}

/** Ordered batch result. Each requested invocation receives its own judgment. */
export interface InvocationSemanticPipelineBatch {
  readonly kind: 'invocation_semantic_pipeline_batch';
  readonly entries: readonly InvocationSemanticPipelineEntry[];
}

/**
 * Canonical high-level interface for invocation semantics.
 * The implementation may use multiple internal derivation phases, but callers
 * interact with one domain operation rather than a collection of low-level steps.
 */
export interface InvocationSemanticPipelineInterface {
  readonly kind: 'invocation_semantic_pipeline';
  readonly contract: InvocationSemanticPipelineContract;
  /** Existing single-invocation semantic authority; pipeline delegates without a runtime wrapper. */
  readonly invocationAuthority: InvocationSemanticAuthorityInterface;
  readonly batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface;
  readonly analyzeInvocation: (
    input: InvocationSemanticInput,
  ) => InvocationSemanticJudgment;
  readonly analyzeBatch: (
    inputs: readonly InvocationSemanticInput[],
  ) => InvocationSemanticPipelineBatch;
  /** Analyze complete semantic knowledge; unlike analyzeBatch, this is not independent per-input batching. */
  readonly analyzeKnowledge: (
    knowledge: SemanticKnowledgeDataFlow,
  ) => InvocationSemanticAnalysis;
}

/**
 * Domain-level guarantees required of any implementation. These are requirements
 * for future wiring, not claims that current production code already satisfies them.
 * The scanner boundary is intentionally a contract here, not an implementation migration.
 */
export interface InvocationSemanticScannerBoundaryContract {
  readonly kind: 'invocation_semantic_scanner_boundary_contract';
  readonly version: 1;
  /** Scanner may collect syntax/source facts, but semantic meaning belongs upstream. */
  readonly inputOwnership: 'scanner-supplies-source-derived-knowledge-and-requested-invocation-identity';
  readonly inputPreparation: 'preserve-source-evidence-and-identity-without-resolving-semantic-meaning';
  /** One invocation is forwarded once and the authority-produced judgment is returned unchanged. */
  readonly singleInvocation: 'delegate-one-invocation-input-directly-to-upstream-invocation-authority';
  /** Whole-knowledge analysis is distinct from a list of independent requested inputs. */
  readonly wholeKnowledge: 'delegate-complete-semantic-knowledge-directly-to-upstream-batch-authority';
  readonly coverageTruthfulness: 'ordinary-invocation-judgments-must-not-be-presented-as-complete-coverage-while-static-invocations-remain-uncovered';
  readonly staticCoverageStatus: 'static-invocation-algebra-authority-and-scanner-wiring-are-not-implemented';
  readonly forbiddenResponsibilities: readonly [
    'target-resolution',
    'argument-binding',
    'effect-projection',
    'semantic-proof-synthesis',
    'obligation-invention',
    'judgment-closure',
    'semantic-fallback-or-reclassification',
  ];
  readonly resultOwnership: 'preserve-authority-produced-judgment-proof-trace-and-obligations-without-reconstruction';
  readonly failureBehavior: 'propagate-authority-contract-failure-without-fabricating-a-fallback-judgment';
}

export const INVOCATION_SEMANTIC_SCANNER_BOUNDARY_CONTRACT: InvocationSemanticScannerBoundaryContract = Object.freeze({
  kind: 'invocation_semantic_scanner_boundary_contract',
  version: 1,
  inputOwnership: 'scanner-supplies-source-derived-knowledge-and-requested-invocation-identity',
  inputPreparation: 'preserve-source-evidence-and-identity-without-resolving-semantic-meaning',
  singleInvocation: 'delegate-one-invocation-input-directly-to-upstream-invocation-authority',
  wholeKnowledge: 'delegate-complete-semantic-knowledge-directly-to-upstream-batch-authority',
  coverageTruthfulness: 'ordinary-invocation-judgments-must-not-be-presented-as-complete-coverage-while-static-invocations-remain-uncovered',
  staticCoverageStatus: 'static-invocation-algebra-authority-and-scanner-wiring-are-not-implemented',
  forbiddenResponsibilities: Object.freeze([
    'target-resolution',
    'argument-binding',
    'effect-projection',
    'semantic-proof-synthesis',
    'obligation-invention',
    'judgment-closure',
    'semantic-fallback-or-reclassification',
  ] as const),
  resultOwnership: 'preserve-authority-produced-judgment-proof-trace-and-obligations-without-reconstruction',
  failureBehavior: 'propagate-authority-contract-failure-without-fabricating-a-fallback-judgment',
});

/**
 * Proof-trace guarantees for every judgment exposed by the invocation pipeline.
 * Trace is part of the domain judgment, not a scanner-generated diagnostic side channel.
 */
export interface InvocationSemanticJudgmentTraceContract {
  readonly kind: 'invocation_semantic_judgment_trace_contract';
  readonly version: 3;
  readonly traceOwner: 'semantic-algebra-produces-authority-validates-scanner-forwards';
  readonly subjectIdentity: 'every-rule-trace-entry-and-witness-belongs-to-the-requested-invocation';
  readonly ruleCoverage: 'every-applicable-semantic-rule-has-one-subject-bound-trace-entry';
  readonly evidenceLineage: 'trace-evidence-is-source-backed-and-covers-derived-claims-and-obligations';
  readonly witnessLineage: 'trace-entry-type-restricts-witness-kinds-to-the-owning-semantic-rule-and-authority-validates-runtime-ownership';
  readonly obligationLineage: 'rule-obligations-and-closure-obligations-preserve-complete-ownership-and-counts';
  readonly closureCorrelation: 'trace-closure-outcome-matches-judgment-status-and-proof-status';
  readonly outcomeCorrelation: 'only-closure-rule-may-report-closed-or-incomplete-and-argument-form-rule-cannot-claim-derivation';
  readonly consumerBehavior: 'scanner-and-downstream-preserve-the-validated-trace-without-reconstruction';
}

export const INVOCATION_SEMANTIC_JUDGMENT_TRACE_CONTRACT: InvocationSemanticJudgmentTraceContract = Object.freeze({
  kind: 'invocation_semantic_judgment_trace_contract',
  version: 3,
  traceOwner: 'semantic-algebra-produces-authority-validates-scanner-forwards',
  subjectIdentity: 'every-rule-trace-entry-and-witness-belongs-to-the-requested-invocation',
  ruleCoverage: 'every-applicable-semantic-rule-has-one-subject-bound-trace-entry',
  evidenceLineage: 'trace-evidence-is-source-backed-and-covers-derived-claims-and-obligations',
  witnessLineage: 'trace-entry-type-restricts-witness-kinds-to-the-owning-semantic-rule-and-authority-validates-runtime-ownership',
  obligationLineage: 'rule-obligations-and-closure-obligations-preserve-complete-ownership-and-counts',
  closureCorrelation: 'trace-closure-outcome-matches-judgment-status-and-proof-status',
  outcomeCorrelation: 'only-closure-rule-may-report-closed-or-incomplete-and-argument-form-rule-cannot-claim-derivation',
  consumerBehavior: 'scanner-and-downstream-preserve-the-validated-trace-without-reconstruction',
});

/**
 * Invocation subjects preserve the source form. A static call is not coerced into
 * SemanticInvocation because it has a class target rather than a receiver expression.
 */
export type InvocationSemanticSubject =
  | Readonly<{ readonly kind: 'ordinary-invocation-subject'; readonly invocation: SemanticInvocation }>
  | Readonly<{ readonly kind: 'static-invocation-subject'; readonly invocation: SemanticStaticInvocation }>;

/** Form participates in identity so equal KnowledgeIds cannot erase a source-form distinction. */
export interface InvocationSemanticSubjectIdentity {
  readonly kind: 'invocation_semantic_subject_identity';
  readonly form: 'ordinary-invocation' | 'static-invocation';
  readonly id: KnowledgeId;
}

/**
 * Canonical inventory entry. Subject form, KnowledgeId, and source evidence live
 * only on the source subject; identity/source are intentionally not copied into
 * sibling fields that could disagree with that subject.
 */
export type InvocationSemanticSubjectCoverageEntry =
  | Readonly<{
      readonly kind: 'ordinary-invocation-subject-coverage-entry';
      readonly subject: Extract<InvocationSemanticSubject, { readonly kind: 'ordinary-invocation-subject' }>;
      readonly disposition: Readonly<{ readonly kind: 'current-judgment-domain'; readonly domain: 'ordinary-invocation' }>;
    }>
  | Readonly<{
      readonly kind: 'static-invocation-subject-coverage-entry';
      readonly subject: Extract<InvocationSemanticSubject, { readonly kind: 'static-invocation-subject' }>;
      readonly disposition: Readonly<{ readonly kind: 'uncovered-judgment-domain'; readonly reason: 'static-invocation-algebra-and-authority-not-yet-implemented' }>;
    }>;

/**
 * A source-knowledge inventory contract, not an implementation claim. It requires
 * every ordinary/static source fact to remain visible, uniquely identified and
 * correlated to its source evidence even when no judgment domain supports it yet.
 */
export interface InvocationSemanticSubjectCoverageInventoryInterface {
  readonly kind: 'invocation_semantic_subject_coverage_inventory';
  readonly contract: InvocationSemanticCoverageContract;
  readonly inspectKnowledge: (knowledge: SemanticKnowledgeDataFlow) => readonly InvocationSemanticSubjectCoverageEntry[];
}

/**
 * Total coverage publication: every source invocation is accounted for exactly once.
 * A source fact is never counted as covered merely because its source form is recognized.
 */
export type InvocationSemanticCoveragePublicationEntry =
  | Readonly<{
      readonly kind: 'ordinary-invocation-judgment-published-coverage-entry';
      readonly subject: Extract<InvocationSemanticSubject, { readonly kind: 'ordinary-invocation-subject' }>;
      readonly disposition: Readonly<{ readonly kind: 'judgment-published'; readonly judgment: InvocationSemanticJudgment }>;
    }>
  | Readonly<{
      readonly kind: 'ordinary-invocation-judgment-unavailable-coverage-entry';
      readonly subject: Extract<InvocationSemanticSubject, { readonly kind: 'ordinary-invocation-subject' }>;
      readonly disposition: Readonly<{ readonly kind: 'judgment-unavailable'; readonly reason: 'ordinary-analysis-omitted-source-subject' }>;
    }>
  | Readonly<{
      readonly kind: 'static-invocation-coverage-entry';
      readonly subject: Extract<InvocationSemanticSubject, { readonly kind: 'static-invocation-subject' }>;
      readonly disposition: Readonly<{ readonly kind: 'uncovered-source-fact'; readonly reason: 'static-invocation-algebra-and-authority-not-implemented' }>;
    }>;

export interface InvocationSemanticCoveragePublication {
  readonly kind: 'invocation_semantic_coverage_publication';
  readonly entries: readonly InvocationSemanticCoveragePublicationEntry[];
}

/** Domain-specific reasons why inventory-to-publication correspondence cannot be accepted. */
export type InvocationSemanticCoveragePublicationViolation =
  | Readonly<{
      readonly kind: 'duplicate-inventory-identity';
      readonly identity: InvocationSemanticSubjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'missing-publication-entry';
      readonly identity: InvocationSemanticSubjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'duplicate-publication-entry';
      readonly identity: InvocationSemanticSubjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'publication-entry-outside-inventory';
      readonly identity: InvocationSemanticSubjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'judgment-subject-mismatch';
      readonly expected: InvocationSemanticSubjectIdentity;
      readonly actual: InvocationSemanticSubjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'source-evidence-mismatch';
      readonly identity: InvocationSemanticSubjectIdentity;
      readonly expected: SemanticSource;
      readonly actual: SemanticSource;
    }>
  | Readonly<{
      readonly kind: 'inventory-subject-identity-mismatch';
      readonly expected: InvocationSemanticSubjectIdentity;
      readonly actual: InvocationSemanticSubjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'inventory-subject-source-mismatch';
      readonly identity: InvocationSemanticSubjectIdentity;
      readonly expected: SemanticSource;
      readonly actual: SemanticSource;
    }>
  | Readonly<{
      readonly kind: 'duplicate-analysis-judgment';
      readonly identity: InvocationSemanticSubjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'analysis-judgment-outside-inventory';
      readonly identity: InvocationSemanticSubjectIdentity;
    }>;

/**
 * One auditable pairing between a canonical source fact and its published disposition.
 * Identity is intentionally not stored here: it is derived from inventoryEntry.subject.
 * The authority must correlate publicationEntry.subject and any published judgment to
 * that canonical subject, so the receipt cannot carry a third, contradictory identity.
 */
export type InvocationSemanticCoveragePublicationCorrespondence =
  | Readonly<{
      readonly kind: 'ordinary-invocation-coverage-correspondence';
      readonly inventoryEntry: Extract<InvocationSemanticSubjectCoverageEntry, { readonly kind: 'ordinary-invocation-subject-coverage-entry' }>;
      /** Exact judgment member from the analysis object captured by the receipt. */
      readonly analysisJudgment: InvocationSemanticJudgment;
      readonly publicationEntry: Extract<InvocationSemanticCoveragePublicationEntry, {
        readonly kind: 'ordinary-invocation-judgment-published-coverage-entry';
        readonly disposition: { readonly kind: 'judgment-published'; readonly judgment: InvocationSemanticJudgment };
      }>;
    }>
  | Readonly<{
      readonly kind: 'ordinary-invocation-unavailable-coverage-correspondence';
      readonly inventoryEntry: Extract<InvocationSemanticSubjectCoverageEntry, { readonly kind: 'ordinary-invocation-subject-coverage-entry' }>;
      readonly publicationEntry: Extract<InvocationSemanticCoveragePublicationEntry, {
        readonly kind: 'ordinary-invocation-judgment-unavailable-coverage-entry';
        readonly disposition: { readonly kind: 'judgment-unavailable'; readonly reason: 'ordinary-analysis-omitted-source-subject' };
      }>;
    }>
  | Readonly<{
      readonly kind: 'static-invocation-coverage-correspondence';
      readonly inventoryEntry: Extract<InvocationSemanticSubjectCoverageEntry, { readonly kind: 'static-invocation-subject-coverage-entry' }>;
      readonly publicationEntry: Extract<InvocationSemanticCoveragePublicationEntry, { readonly kind: 'static-invocation-coverage-entry' }>;
    }>;

/** A successful result carries the correspondence ledger, not only a self-asserted validation label. */
export type InvocationSemanticCoveragePublicationResult =
  | Readonly<{
      readonly kind: 'validated-publication';
      readonly publication: InvocationSemanticCoveragePublication;
      readonly validation: Readonly<{
        readonly kind: 'invocation_semantic_coverage_publication_validation';
        readonly contract: InvocationSemanticCoverageContract;
        /** Exact authority boundary whose invariants were enforced to build this receipt. */
        readonly authorityBoundary: InvocationSemanticCoveragePublicationAuthorityBoundaryContract;
        /** Exact analysis input whose judgments were checked against the canonical inventory and publication. */
        readonly analysis: InvocationSemanticAnalysis;
        readonly correspondences: readonly InvocationSemanticCoveragePublicationCorrespondence[];
        readonly invariant: 'one-publication-entry-per-inventory-identity-with-matching-form-subject-and-source-evidence-and-each-published-ordinary-judgment-bound-to-the-exact-analysis-judgment';
      }>;
    }>
  | Readonly<{
      readonly kind: 'rejected-publication';
      /** Exact analysis input evaluated by this authority; rejection does not detach its subject judgments from the failure ledger. */
      readonly analysis: InvocationSemanticAnalysis;
      readonly violations: readonly [
        InvocationSemanticCoveragePublicationViolation,
        ...InvocationSemanticCoveragePublicationViolation[],
      ];
    }>;

export interface InvocationSemanticCoveragePublicationInput {
  /** Canonical inventory produced by the source-subject inventory authority. */
  readonly inventory: readonly InvocationSemanticSubjectCoverageEntry[];
  /** Judgment results produced by the ordinary invocation semantic pipeline. */
  readonly analysis: InvocationSemanticAnalysis;
}

/**
 * Authority-specific execution boundary for inventory-bound coverage publication.
 * This contract defines what must be validated, not the implementation that validates it.
 */
export interface InvocationSemanticCoveragePublicationAuthorityBoundaryContract {
  readonly kind: 'invocation_semantic_coverage_publication_authority_boundary_contract';
  readonly version: 2;
  readonly canonicalIdentity: 'derive-form-and-knowledge-identity-from-inventory-subject-without-independent-identity-fields';
  readonly inventoryUniqueness: 'reject-duplicate-source-subject-identities-before-publishing';
  readonly publicationBijection: 'each-inventory-identity-has-exactly-one-publication-entry-and-no-entry-exists-outside-inventory';
  readonly analysisBijection: 'each-analysis-judgment-belongs-to-exactly-one-ordinary-inventory-subject-and-no-analysis-judgment-is-unmatched';
  readonly judgmentBinding: 'published-judgment-invocation-form-knowledge-id-and-source-span-match-canonical-inventory-subject';
  readonly evidenceBinding: 'subject-source-evidence-is-preserved-and-compared-at-each-correspondence-edge';
  readonly failureResult: 'return-the-exact-rejected-analysis-input-with-a-non-empty-typed-violation-ledger-and-never-return-a-validated-publication-after-any-violation';
  readonly receiptOwnership: 'validated-receipt-is-built-from-the-validated-inventory-publication-pairs-not-self-asserted-by-input';
  readonly analysisReceiptBinding: 'validated-receipt-retains-the-exact-analysis-input-and-links-each-ordinary-correspondence-to-one-analysis-judgment';
  readonly semanticOwnership: 'authority-validates-correspondence-and-does-not-derive-or-reclassify-invocation-meaning';
  readonly staticCoverageTruth: 'static-subjects-remain-explicitly-uncovered-until-static-algebra-and-authority-exist';
}

export const INVOCATION_SEMANTIC_COVERAGE_PUBLICATION_AUTHORITY_BOUNDARY_CONTRACT: InvocationSemanticCoveragePublicationAuthorityBoundaryContract = Object.freeze({
  kind: 'invocation_semantic_coverage_publication_authority_boundary_contract',
  version: 2,
  canonicalIdentity: 'derive-form-and-knowledge-identity-from-inventory-subject-without-independent-identity-fields',
  inventoryUniqueness: 'reject-duplicate-source-subject-identities-before-publishing',
  publicationBijection: 'each-inventory-identity-has-exactly-one-publication-entry-and-no-entry-exists-outside-inventory',
  analysisBijection: 'each-analysis-judgment-belongs-to-exactly-one-ordinary-inventory-subject-and-no-analysis-judgment-is-unmatched',
  judgmentBinding: 'published-judgment-invocation-form-knowledge-id-and-source-span-match-canonical-inventory-subject',
  evidenceBinding: 'subject-source-evidence-is-preserved-and-compared-at-each-correspondence-edge',
  failureResult: 'return-the-exact-rejected-analysis-input-with-a-non-empty-typed-violation-ledger-and-never-return-a-validated-publication-after-any-violation',
  receiptOwnership: 'validated-receipt-is-built-from-the-validated-inventory-publication-pairs-not-self-asserted-by-input',
  analysisReceiptBinding: 'validated-receipt-retains-the-exact-analysis-input-and-links-each-ordinary-correspondence-to-one-analysis-judgment',
  semanticOwnership: 'authority-validates-correspondence-and-does-not-derive-or-reclassify-invocation-meaning',
  staticCoverageTruth: 'static-subjects-remain-explicitly-uncovered-until-static-algebra-and-authority-exist',
});

/**
 * Upstream publication authority for total source-invocation coverage. It consumes
 * the canonical inventory instead of rebuilding it from raw knowledge, so inventory
 * ownership and judgment correlation remain separate responsibilities. Implementations
 * must satisfy the authority boundary before returning a validated receipt.
 */
export interface InvocationSemanticCoveragePublicationInterface {
  readonly kind: 'invocation_semantic_coverage_publication_authority';
  /** Domain rules for total source-invocation coverage. */
  readonly contract: InvocationSemanticCoverageContract;
  /** Operational authority obligations; a successful receipt must expose this exact boundary. */
  readonly authorityBoundary: InvocationSemanticCoveragePublicationAuthorityBoundaryContract;
  /** Constructs the publication and correspondence receipt from validated input; callers cannot self-assert success. */
  readonly publish: (input: InvocationSemanticCoveragePublicationInput) => InvocationSemanticCoveragePublicationResult;
}

/**
 * Integrated response aggregates the exact publication-authority receipt with the closed
 * PHP invocation batch. It adds no second validation authority; the publication receipt
 * remains the owner of generic invocation correspondence and validation evidence.
 */
export interface InvocationSemanticIntegratedResponseContract {
  readonly kind: 'invocation_semantic_integrated_response_contract';
  readonly version: 10;
  readonly acceptedAnalysisOwnership: 'integrated-response-retains-the-exact-publication-result-whose-validation-receipt-or-rejection-result-owns-analysis';
  readonly correspondenceOwnership: 'publication-authority-is-the-single-owner-of-inventory-analysis-publication-correspondence-validation';
  readonly rejectionMeaning: 'rejected-publication-is-forwarded-directly-with-its-exact-analysis-input-and-typed-violations';
  readonly acceptedMeaning: 'validated-correspondence-does-not-assert-every-individual-judgment-is-closed';
  readonly staticCoverageTruth: 'static-invocations-remain-explicitly-uncovered-until-static-algebra-and-authority-are-implemented';
  readonly consumerOwnership: 'scanner-forwards-the-integrated-response-without-rebuilding-analysis-publication-correspondence-or-closure';
  readonly phpFunctionInvocationOwnership: 'integrated-response-contains-the-typed-php-invocation-integration-state-inside-the-response-not-as-a-detached-sidecar';
  readonly phpFunctionInvocationClosure: 'only-an-authority-issued-validated-receipt-is-accepted-as-a-batch-and-rejected-closure-remains-an-explicit-typed-outcome';
  readonly publicationOwnership: 'the-exact-publication-authority-result-is-retained-as-one-component-without-revalidation-or-reconstruction';
}

export const INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_CONTRACT: InvocationSemanticIntegratedResponseContract = Object.freeze({
  kind: 'invocation_semantic_integrated_response_contract',
  version: 10,
  acceptedAnalysisOwnership: 'integrated-response-retains-the-exact-publication-result-whose-validation-receipt-or-rejection-result-owns-analysis',
  correspondenceOwnership: 'publication-authority-is-the-single-owner-of-inventory-analysis-publication-correspondence-validation',
  rejectionMeaning: 'rejected-publication-is-forwarded-directly-with-its-exact-analysis-input-and-typed-violations',
  acceptedMeaning: 'validated-correspondence-does-not-assert-every-individual-judgment-is-closed',
  staticCoverageTruth: 'static-invocations-remain-explicitly-uncovered-until-static-algebra-and-authority-are-implemented',
  consumerOwnership: 'scanner-forwards-the-integrated-response-without-rebuilding-analysis-publication-correspondence-or-closure',
  phpFunctionInvocationOwnership: 'integrated-response-contains-the-typed-php-invocation-integration-state-inside-the-response-not-as-a-detached-sidecar',
  phpInvocationProjectionOwnership: 'the-upstream-php-invocation-integration-interface-projects-source-evidence-before-the-scanner-boundary-and-composition-forwards-the-closed-outcome-without-reclassification',
  scannerInputClosureBoundary: 'scanner-facing-composition-accepts-only-the-authority-integrated-php-source-outcome-raw-composition-evidence-cannot-cross-this-boundary',
  phpFunctionInvocationClosure: 'only-an-authority-issued-validated-receipt-is-accepted-as-a-batch-and-rejected-closure-remains-an-explicit-typed-outcome',
  publicationOwnership: 'the-exact-publication-authority-result-is-retained-as-one-component-without-revalidation-or-reconstruction',
});

/**
 * The integrated response is the single aggregate returned to the scanner. It preserves
 * the exact existing publication result and embeds the complete PHP invocation batch;
 * neither component is reclassified or reconstructed by this response contract.
 */
export interface InvocationSemanticIntegratedResponse {
  readonly kind: 'invocation_semantic_integrated_response';
  readonly publication: InvocationSemanticCoveragePublicationResult;
  readonly phpFunctionInvocations: PhpSourceInvocationSemanticPipelineIntegrationResult;
}

/**
 * Composition contract for the integrated response. This is deliberately not an
 * authority: inventory, semantic analysis, and correspondence validation remain
 * owned by their existing interfaces. The composition must feed the exact same
 * knowledge value through inventory and analysis before handing both to publication.
 */
export interface InvocationSemanticIntegratedResponseCompositionContract {
  readonly kind: 'invocation_semantic_integrated_response_composition_contract';
  readonly version: 20;
  readonly compositionOrder: 'derive-inventory-and-analysis-from-the-same-knowledge-then-publish-the-pair-and-return-the-publication-bound-integrated-response';
  readonly inventoryOwnership: 'source-subject-inventory-interface-owns-canonical-subject-discovery';
  readonly judgmentOwnership: 'invocation-semantic-pipeline-owns-analysis-and-judgment-derivation';
  readonly correspondenceOwnership: 'coverage-publication-authority-remains-the-single-owner-of-inventory-analysis-publication-validation';
  readonly responseOwnership: 'integrated-response-is-one-aggregate-containing-the-exact-publication-result-and-lossless-typed-php-invocation-outcome';
  readonly sourceBinding: 'composition-consumes-the-complete-source-correlated-knowledge-projection;inventory-and-analysis-use-its-exact-canonical-knowledge-graph;response-only-result-does-not-republish-knowledge-or-provenance';
  readonly failureSemantics: 'preserve-the-publication-authoritys-typed-result-and-never-fabricate-a-fallback-analysis-or-receipt';
  readonly publicBoundary: 'expose-only-the-integrate-operation-and-its-contract; component-authorities-remain-private-implementation-dependencies';
  readonly dependencyBinding: 'composition-executor-receives-existing-inventory-pipeline-and-publication-authorities-through-one-typed-dependency-contract';
  readonly runtimeStatus: 'inventory-and-publication-are-owned-upstream-and-scanner-receives-one-integrated-response-without-a-detached-analysis-projection';
  readonly phpFunctionInvocationOwnership: 'composition-preserves-the-exact-closed-php-function-invocation-judgment-batch-without-reclassification-or-expression-projection';
  readonly phpFunctionInvocationCoverage: 'integrated-response-preserves-a-closed-batch-or-the-exact-blocked-pipeline-stage-without-generic-pending-collapse';
  readonly phpFunctionInvocationFailure: 'every-blocked-pipeline-stage-and-rejected-batch-closure-remains-a-typed-outcome-and-is-never-coerced-into-an-empty-or-partial-batch';
  readonly phpFunctionInvocationSourceBinding: 'each-php-invocation-judgment-must-remain-correlated-to-its-source-evidence-and-source-file';
  readonly phpFunctionInvocationKnowledgeBinding: 'a-supplied-php-invocation-batch-must-be-source-bound-to-the-integrated-knowledge-input-while-pending-state-preserves-unresolved-scanner-obligations';
  readonly phpSourcePipelineBinding: 'composition-retains-the-exact-authority-integrated-source-pipeline-outcome-without-reprojection-or-reclassification';
  readonly phpInvocationProjectionOwnership: 'the-upstream-php-invocation-integration-interface-projects-source-evidence-before-the-scanner-boundary-and-composition-forwards-the-closed-outcome-without-reclassification';
  readonly scannerInputClosureBoundary: 'scanner-facing-composition-accepts-only-the-authority-integrated-php-source-outcome-raw-composition-evidence-cannot-cross-this-boundary';
  readonly sourceOutcomePreservation: 'composition-retains-the-exact-phpSourceInvocationPipeline-input-as-phpFunctionInvocations;the-composition-result-publishes-only-the-integrated-response-and-does-not-repeat-the-canonical-knowledge-value';
  readonly provenanceBinding: 'the-composition-input-retains-source-file-and-evidence-provider-with-the-knowledge-graph-until-both-inventory-and-analysis-have-consumed-that-exact-graph';
}

export const INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_COMPOSITION_CONTRACT: InvocationSemanticIntegratedResponseCompositionContract = Object.freeze({
  kind: 'invocation_semantic_integrated_response_composition_contract',
  version: 20,
  compositionOrder: 'derive-inventory-and-analysis-from-the-same-knowledge-then-publish-the-pair-and-return-the-publication-bound-integrated-response',
  inventoryOwnership: 'source-subject-inventory-interface-owns-canonical-subject-discovery',
  judgmentOwnership: 'invocation-semantic-pipeline-owns-analysis-and-judgment-derivation',
  correspondenceOwnership: 'coverage-publication-authority-remains-the-single-owner-of-inventory-analysis-publication-validation',
  responseOwnership: 'integrated-response-is-one-aggregate-containing-the-exact-publication-result-and-lossless-typed-php-invocation-outcome',
  sourceBinding: 'composition-consumes-the-complete-source-correlated-knowledge-projection;inventory-and-analysis-use-its-exact-canonical-knowledge-graph;response-only-result-does-not-republish-knowledge-or-provenance',
  failureSemantics: 'preserve-the-publication-authoritys-typed-result-and-never-fabricate-a-fallback-analysis-or-receipt',
  publicBoundary: 'expose-only-the-integrate-operation-and-its-contract; component-authorities-remain-private-implementation-dependencies',
  dependencyBinding: 'composition-executor-receives-existing-inventory-pipeline-and-publication-authorities-through-one-typed-dependency-contract',
  runtimeStatus: 'inventory-and-publication-are-owned-upstream-and-scanner-receives-one-integrated-response-without-a-detached-analysis-projection',
  phpFunctionInvocationOwnership: 'composition-preserves-the-exact-closed-php-function-invocation-judgment-batch-without-reclassification-or-expression-projection',
  phpFunctionInvocationCoverage: 'integrated-response-preserves-a-closed-batch-or-the-exact-blocked-pipeline-stage-without-generic-pending-collapse',
  phpFunctionInvocationFailure: 'every-blocked-pipeline-stage-and-rejected-batch-closure-remains-a-typed-outcome-and-is-never-coerced-into-an-empty-or-partial-batch',
  phpFunctionInvocationSourceBinding: 'each-php-invocation-judgment-must-remain-correlated-to-its-source-evidence-and-source-file',
  phpFunctionInvocationKnowledgeBinding: 'a-supplied-php-invocation-batch-must-be-source-bound-to-the-integrated-knowledge-input-while-pending-state-preserves-unresolved-scanner-obligations',
  phpSourcePipelineBinding: 'composition-retains-the-exact-authority-integrated-source-pipeline-outcome-without-reprojection-or-reclassification',
  phpInvocationProjectionOwnership: 'the-upstream-php-invocation-integration-interface-projects-source-evidence-before-the-scanner-boundary-and-composition-forwards-the-closed-outcome-without-reclassification',
  scannerInputClosureBoundary: 'scanner-facing-composition-accepts-only-the-authority-integrated-php-source-outcome-raw-composition-evidence-cannot-cross-this-boundary',
  sourceOutcomePreservation: 'composition-retains-the-exact-phpSourceInvocationPipeline-input-as-phpFunctionInvocations;the-composition-result-publishes-only-the-integrated-response-and-does-not-repeat-the-canonical-knowledge-value',
  provenanceBinding: 'the-composition-input-retains-source-file-and-evidence-provider-with-the-knowledge-graph-until-both-inventory-and-analysis-have-consumed-that-exact-graph',
});

/** The knowledge graph and closed-or-pending source-pipeline evidence enter one composition. */
export interface InvocationSemanticIntegratedResponseCompositionInput {
  /** Keep source identity and evidence-provider provenance bound to the exact graph consumed downstream. */
  readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection;
  /** The exact authority-integrated whole-file PHP outcome crosses this boundary unchanged. */
  readonly phpSourceInvocationPipeline: InvocationPhpSourceIntegratedResponse;
}

/**
 * Internal composition dependencies. They are injected into the upstream executor,
 * never exposed as separate scanner-facing operations. Each dependency retains its
 * existing semantic ownership; composition only sequences their typed results.
 */
export interface InvocationSemanticIntegratedResponseCompositionDependencies {
  readonly inventory: InvocationSemanticSubjectCoverageInventoryInterface;
  readonly pipeline: InvocationSemanticPipelineInterface;
  readonly publicationAuthority: InvocationSemanticCoveragePublicationInterface;
}

/**
 * Source-bound composition result. The response retains the exact publication result and the exact PHP invocation batch; neither is reconstructed by composition.
 */
export interface InvocationSemanticIntegratedResponseCompositionResult {
  readonly kind: 'invocation_semantic_integrated_response_composition_result';
  /** The response is the composition output; canonical knowledge remains owned by its source-correlated projection. */
  readonly response: InvocationSemanticIntegratedResponse;
}

/**
 * Interface-first composition of existing owners; it adds no second semantic authority.
 * The upstream executor accepts typed component dependencies while exposing only integrate().
 * Production use remains gated on concrete inventory and publication-authority implementations.
 */
export interface InvocationSemanticIntegratedResponseCompositionInterface {
  readonly kind: 'invocation_semantic_integrated_response_composition';
  readonly contract: InvocationSemanticIntegratedResponseCompositionContract;
  /** The only public operation: consumers cannot bypass composition by calling component authorities. */
  readonly integrate: (
    input: InvocationSemanticIntegratedResponseCompositionInput,
  ) => InvocationSemanticIntegratedResponseCompositionResult;
}

/** Candidate-specific evidence linking a static class/operation pair to one callable. */
export interface InvocationStaticTargetCandidateEvidence {
  readonly kind: 'invocation_static_target_candidate_evidence';
  readonly subject: KnowledgeId;
  readonly candidate: KnowledgeId;
  readonly className: SemanticStaticInvocation['className'];
  readonly operation: SemanticStaticInvocation['operation'];
  readonly source: SemanticSource;
  readonly relation: 'class-operation-pair-resolves-to-callable';
}

/** A candidate is a callable plus proof of the exact class/operation pair. */
export interface InvocationStaticTargetCandidate {
  readonly kind: 'invocation_static_target_candidate';
  readonly callable: SemanticCallable;
  readonly evidence: readonly [InvocationStaticTargetCandidateEvidence, ...InvocationStaticTargetCandidateEvidence[]];
}

/** Stable semantic identity for one obligation; not a scanner-generated display key. */
export interface InvocationStaticSemanticObligationIdentity {
  readonly kind: 'invocation_static_semantic_obligation_identity';
  readonly id: KnowledgeId;
  readonly subject: KnowledgeId;
  readonly domain: 'target-resolution' | 'argument-form' | 'argument-parameter' | 'effect-projection';
}

/** Source-backed unresolved obligation; deliberately contains no fabricated callable. */
export interface InvocationStaticTargetUnresolvedObligation {
  readonly kind: 'static_callable_target_unresolved';
  readonly identity: InvocationStaticSemanticObligationIdentity;
  readonly subject: KnowledgeId;
  readonly requestedClass: SemanticStaticInvocation['className'];
  readonly requestedOperation: SemanticStaticInvocation['operation'];
  readonly reason: 'no-candidate-matches-class-and-operation-pair';
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
}

/**
 * Closed target-resolution outcomes for a static call. Candidate cardinality is
 * encoded in the union; candidate evidence remains inseparable from each target.
 * This is a target sub-judgment, not a claim that full static invocation analysis
 * (binding, effects, proof, and closure) has already been implemented.
 */
export type InvocationStaticTargetResolution =
  | Readonly<{
      readonly kind: 'resolved';
      readonly subject: SemanticStaticInvocation;
      readonly candidate: InvocationStaticTargetCandidate;
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>
  | Readonly<{
      readonly kind: 'unresolved';
      readonly subject: SemanticStaticInvocation;
      readonly candidates: readonly [];
      readonly obligation: InvocationStaticTargetUnresolvedObligation;
    }>
  | Readonly<{
      readonly kind: 'ambiguous';
      readonly subject: SemanticStaticInvocation;
      readonly candidates: readonly [InvocationStaticTargetCandidate, InvocationStaticTargetCandidate, ...InvocationStaticTargetCandidate[]];
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>;

export interface InvocationStaticTargetResolutionContract {
  readonly kind: 'invocation_static_target_resolution_contract';
  readonly version: 1;
  readonly lookupKey: 'canonical-class-identity-and-operation-identity-as-one-pair';
  readonly resolvedCardinality: 'exactly-one-distinct-candidate-with-candidate-specific-evidence';
  readonly unresolvedCardinality: 'zero-candidates-with-source-backed-obligation-and-no-callable';
  readonly ambiguousCardinality: 'two-or-more-distinct-candidates-with-per-candidate-evidence';
  readonly duplicatePolicy: 'deduplicate-only-by-canonical-callable-identity-within-the-same-class-operation-pair';
  readonly sourceCorrelation: 'subject-obligation-candidate-and-evidence-identities-must-agree';
  readonly obligationIdentity: 'every-obligation-has-a-stable-upstream-identity-bound-to-subject-and-domain';
  readonly staticFormPreservation: 'never-coerce-to-ordinary-invocation-or-invent-a-receiver';
}

export const INVOCATION_STATIC_TARGET_RESOLUTION_CONTRACT: InvocationStaticTargetResolutionContract = Object.freeze({
  kind: 'invocation_static_target_resolution_contract',
  version: 1,
  lookupKey: 'canonical-class-identity-and-operation-identity-as-one-pair',
  resolvedCardinality: 'exactly-one-distinct-candidate-with-candidate-specific-evidence',
  unresolvedCardinality: 'zero-candidates-with-source-backed-obligation-and-no-callable',
  ambiguousCardinality: 'two-or-more-distinct-candidates-with-per-candidate-evidence',
  duplicatePolicy: 'deduplicate-only-by-canonical-callable-identity-within-the-same-class-operation-pair',
  sourceCorrelation: 'subject-obligation-candidate-and-evidence-identities-must-agree',
  obligationIdentity: 'every-obligation-has-a-stable-upstream-identity-bound-to-subject-and-domain',
  staticFormPreservation: 'never-coerce-to-ordinary-invocation-or-invent-a-receiver',
});

/** Upstream proof that this exact static invocation has normalized positional arguments. */
export interface InvocationStaticPositionalArgumentEvidence {
  readonly kind: 'invocation_static_positional_argument_evidence';
  readonly invocation: KnowledgeId;
  readonly normalizedArguments: readonly KnowledgeId[];
  readonly normalization: 'upstream-confirmed-positional-arguments';
  readonly source: SemanticSource;
}

/** One source-backed argument-to-parameter correspondence for a resolved static callable. */
export interface InvocationStaticArgumentBindingClaim {
  readonly kind: 'static-bound-argument';
  readonly subject: KnowledgeId;
  readonly target: KnowledgeId;
  readonly argument: KnowledgeId;
  readonly parameter: KnowledgeId;
  readonly argumentEvidence: readonly [SemanticSource, ...SemanticSource[]];
  readonly parameterEvidence: readonly [SemanticSource, ...SemanticSource[]];
  readonly correspondenceEvidence: readonly [SemanticSource, ...SemanticSource[]];
  readonly basis: 'confirmed-positional-order';
}

export interface InvocationStaticUnboundArgument {
  readonly kind: 'static-unbound-argument';
  readonly subject: KnowledgeId;
  readonly argument: KnowledgeId;
  readonly reason: 'argument-position-has-no-parameter';
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
}

export interface InvocationStaticArgumentFormUnprovenDisposition {
  readonly kind: 'static-argument-form-unproven';
  readonly subject: KnowledgeId;
  readonly argument: KnowledgeId;
  readonly reason: 'ordered-identities-do-not-prove-positional-argument-semantics';
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
}

export type InvocationStaticArgumentDisposition = InvocationStaticArgumentBindingClaim | InvocationStaticUnboundArgument;

/** Binding is keyed by the static subject and a previously resolved callable; it has no receiver field. */
export type InvocationStaticArgumentBindingJudgment =
  | Readonly<{
      readonly kind: 'not-required';
      readonly subject: SemanticStaticInvocation & { readonly arguments: readonly [] };
      readonly target: SemanticCallable;
      readonly dispositions: readonly [];
      readonly positionalEvidence: Extract<InvocationStaticPositionalEvidenceResult, { readonly kind: 'positional-evidence-not-required' }>;
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>
  | Readonly<{
      readonly kind: 'established';
      readonly subject: SemanticStaticInvocation & { readonly arguments: readonly [KnowledgeId, ...KnowledgeId[]] };
      readonly target: SemanticCallable;
      readonly dispositions: readonly [InvocationStaticArgumentBindingClaim, ...InvocationStaticArgumentBindingClaim[]];
      readonly positionalEvidence: InvocationStaticPositionalArgumentEvidence;
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>
  | Readonly<{
      readonly kind: 'incomplete';
      readonly subject: SemanticStaticInvocation & { readonly arguments: readonly [KnowledgeId, ...KnowledgeId[]] };
      readonly target: SemanticCallable;
      readonly dispositions: readonly [InvocationStaticArgumentDisposition, ...InvocationStaticArgumentDisposition[]];
      readonly positionalEvidence: InvocationStaticPositionalArgumentEvidence;
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>
  | Readonly<{
      readonly kind: 'argument-form-unproven';
      readonly subject: SemanticStaticInvocation & { readonly arguments: readonly [KnowledgeId, ...KnowledgeId[]] };
      readonly target: SemanticCallable;
      readonly dispositions: readonly [InvocationStaticArgumentFormUnprovenDisposition, ...InvocationStaticArgumentFormUnprovenDisposition[]];
      readonly positionalEvidence: Extract<InvocationStaticPositionalEvidenceResult, { readonly kind: 'positional-evidence-unavailable' }>;
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>
  | Readonly<{
      readonly kind: 'blocked';
      readonly subject: SemanticStaticInvocation;
      readonly targetResolution: Extract<InvocationStaticTargetResolution, { readonly kind: 'unresolved' | 'ambiguous' }>;
      readonly dispositions: readonly [];
      readonly positionalEvidence: Extract<InvocationStaticPositionalEvidenceResult, { readonly kind: 'positional-evidence-not-assessable' }>;
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>;

/** Distinct effect channels; every projected emission belongs to the resolved static callable. */
export interface InvocationStaticTargetAmbiguousObligation {
  readonly kind: 'static_callable_target_ambiguous';
  readonly identity: InvocationStaticSemanticObligationIdentity;
  readonly subject: KnowledgeId;
  readonly candidates: readonly [InvocationStaticTargetCandidate, InvocationStaticTargetCandidate, ...InvocationStaticTargetCandidate[]];
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
}

/** A unique callable exists, but its declared effect contract is not source-established. */
export interface InvocationStaticEffectProjectionUnresolvedObligation {
  readonly kind: 'static_callable_effects_unavailable';
  readonly identity: InvocationStaticSemanticObligationIdentity;
  readonly subject: KnowledgeId;
  readonly target: SemanticCallable;
  readonly reason: 'callable-effect-contract-not-established';
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
}

export type InvocationStaticEffectProjectionJudgment =
  | Readonly<{
      readonly kind: 'effects-projected';
      readonly subject: SemanticStaticInvocation;
      readonly target: SemanticCallable;
      readonly resultEmissions: readonly (Omit<SemanticEmission, 'definition'> & { readonly definition: { readonly code: 'result' } })[];
      readonly exceptionEmissions: readonly (Omit<SemanticEmission, 'definition'> & { readonly definition: { readonly code: 'exception' } })[];
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
      readonly obligations: readonly [];
    }>
  | Readonly<{
      readonly kind: 'effects-unavailable';
      readonly subject: SemanticStaticInvocation;
      readonly targetResolution: Extract<InvocationStaticTargetResolution, { readonly kind: 'unresolved' }>;
      readonly resultEmissions: readonly [];
      readonly exceptionEmissions: readonly [];
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
      readonly obligations: readonly [InvocationStaticTargetUnresolvedObligation, ...InvocationStaticTargetUnresolvedObligation[]];
    }>
  | Readonly<{
      readonly kind: 'effects-unavailable';
      readonly subject: SemanticStaticInvocation;
      readonly targetResolution: Extract<InvocationStaticTargetResolution, { readonly kind: 'ambiguous' }>;
      readonly resultEmissions: readonly [];
      readonly exceptionEmissions: readonly [];
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
      readonly obligations: readonly [InvocationStaticTargetAmbiguousObligation, ...InvocationStaticTargetAmbiguousObligation[]];
    }>
  | Readonly<{
      readonly kind: 'effects-unavailable';
      readonly subject: SemanticStaticInvocation;
      readonly targetResolution: Extract<InvocationStaticTargetResolution, { readonly kind: 'resolved' }>;
      readonly resultEmissions: readonly [];
      readonly exceptionEmissions: readonly [];
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
      readonly obligations: readonly [InvocationStaticEffectProjectionUnresolvedObligation, ...InvocationStaticEffectProjectionUnresolvedObligation[]];
    }>;

export interface InvocationStaticArgumentAndEffectContract {
  readonly kind: 'invocation_static_argument_and_effect_contract';
  readonly version: 1;
  readonly argumentIdentity: 'every-disposition-belongs-to-the-static-subject-and-exactly-one-source-argument';
  readonly bindingPrerequisite: 'unique-static-target-resolution-and-explicit-upstream-positional-normalization';
  readonly noReceiver: 'static-binding-uses-class-operation-target-and-never-requires-or-invents-a-receiver';
  readonly cardinality: 'one-ordered-disposition-per-source-argument-without-loss-or-duplication-and-incomplete-requires-an-unbound-argument';
  readonly provenance: 'argument-parameter-and-correspondence-claims-each-retain-their-own-non-empty-source-evidence';
  readonly targetUnavailable: 'unresolved-or-ambiguous-target-blocks-binding-and-effect-projection';
  readonly effectOwnership: 'only-emissions-declared-by-the-uniquely-resolved-callable-may-be-projected';
  readonly effectUnavailability: 'a-resolved-target-without-source-established-effect-contract-produces-an-explicit-effect-projection-obligation-and-no-emissions';
  readonly effectChannels: 'result-and-exception-emissions-remain-distinct';
  readonly closureBoundary: 'these-are-subjudgments-only-and-do-not-claim-full-static-invocation-proof-or-closure';
}

export const INVOCATION_STATIC_ARGUMENT_AND_EFFECT_CONTRACT: InvocationStaticArgumentAndEffectContract = Object.freeze({
  kind: 'invocation_static_argument_and_effect_contract',
  version: 1,
  argumentIdentity: 'every-disposition-belongs-to-the-static-subject-and-exactly-one-source-argument',
  bindingPrerequisite: 'unique-static-target-resolution-and-explicit-upstream-positional-normalization',
  noReceiver: 'static-binding-uses-class-operation-target-and-never-requires-or-invents-a-receiver',
  cardinality: 'one-ordered-disposition-per-source-argument-without-loss-or-duplication-and-incomplete-requires-an-unbound-argument',
  provenance: 'argument-parameter-and-correspondence-claims-each-retain-their-own-non-empty-source-evidence',
  targetUnavailable: 'unresolved-or-ambiguous-target-blocks-binding-and-effect-projection',
  effectOwnership: 'only-emissions-declared-by-the-uniquely-resolved-callable-may-be-projected',
  effectUnavailability: 'a-resolved-target-without-source-established-effect-contract-produces-an-explicit-effect-projection-obligation-and-no-emissions',
  effectChannels: 'result-and-exception-emissions-remain-distinct',
  closureBoundary: 'these-are-subjudgments-only-and-do-not-claim-full-static-invocation-proof-or-closure',
});

/** Static-specific obligations retained by the aggregate judgment without ordinary-call coercion. */
export type InvocationStaticSemanticObligation =
  | InvocationStaticTargetUnresolvedObligation
  | InvocationStaticTargetAmbiguousObligation
  | InvocationStaticEffectProjectionUnresolvedObligation
  | Readonly<{
      readonly kind: 'static_argument_form_unproven';
      readonly identity: InvocationStaticSemanticObligationIdentity;
      readonly subject: KnowledgeId;
      readonly argument: KnowledgeId;
      readonly reason: 'ordered-identities-do-not-prove-positional-argument-semantics';
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>
  | Readonly<{
      readonly kind: 'static_argument_parameter_unresolved';
      readonly identity: InvocationStaticSemanticObligationIdentity;
      readonly subject: KnowledgeId;
      readonly target: KnowledgeId;
      readonly argument: KnowledgeId;
      readonly reason: 'argument-position-has-no-parameter';
      readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
    }>;

export type InvocationStaticSemanticRuleId =
  | 'static-source-subject-presence'
  | 'static-target-resolution'
  | 'static-argument-binding'
  | 'static-effect-projection'
  | 'static-judgment-closure';

/**
 * Closed rule-to-obligation relation. This is the domain-level source of truth for
 * which unresolved facts each static invocation rule may own; authority validates
 * the relation rather than inferring obligation ownership from diagnostic text.
 */
export type InvocationStaticSemanticRuleObligationRelation =
  | Readonly<{
      readonly ruleId: 'static-source-subject-presence';
      readonly obligationKinds: readonly [];
      readonly applicability: 'source-subject-must-exist-exactly-once';
      readonly witnessOutcome: 'established-only';
    }>
  | Readonly<{
      readonly ruleId: 'static-target-resolution';
      readonly obligationKinds: readonly ['static_callable_target_unresolved', 'static_callable_target_ambiguous'];
      readonly applicability: 'unresolved-or-ambiguous-target-resolution';
      readonly witnessOutcome: 'established-or-obligated';
    }>
  | Readonly<{
      readonly ruleId: 'static-argument-binding';
      readonly obligationKinds: readonly ['static_argument_form_unproven', 'static_argument_parameter_unresolved'];
      readonly applicability: 'unique-target-and-source-arguments-present';
      readonly witnessOutcome: 'established-or-obligated';
    }>
  | Readonly<{
      readonly ruleId: 'static-effect-projection';
      readonly obligationKinds: readonly ['static_callable_effects_unavailable'];
      readonly applicability: 'unique-target-effect-contract-unavailable';
      readonly witnessOutcome: 'established-or-obligated';
    }>
  | Readonly<{
      readonly ruleId: 'static-judgment-closure';
      readonly obligationKinds: readonly [];
      readonly applicability: 'all-applicable-domain-rules-have-no-unresolved-obligations';
      readonly witnessOutcome: 'closed-or-incomplete';
    }>;

export interface InvocationStaticSemanticRuleObligationContract {
  readonly kind: 'invocation_static_semantic_rule_obligation_contract';
  readonly version: 1;
  readonly relations: readonly [
    Extract<InvocationStaticSemanticRuleObligationRelation, { readonly ruleId: 'static-source-subject-presence' }>,
    Extract<InvocationStaticSemanticRuleObligationRelation, { readonly ruleId: 'static-target-resolution' }>,
    Extract<InvocationStaticSemanticRuleObligationRelation, { readonly ruleId: 'static-argument-binding' }>,
    Extract<InvocationStaticSemanticRuleObligationRelation, { readonly ruleId: 'static-effect-projection' }>,
    Extract<InvocationStaticSemanticRuleObligationRelation, { readonly ruleId: 'static-judgment-closure' }>
  ];
  readonly ownership: 'each-obligation-kind-is-owned-by-exactly-one-rule-and-must-not-be-reclassified-by-scanner-or-authority';
  readonly order: 'source-presence-target-resolution-argument-binding-effect-projection-closure';
  readonly closure: 'closed-requires-no-obligations-from-any-applicable-rule-and-incomplete-requires-at-least-one-owned-obligation';
}

const INVOCATION_STATIC_SEMANTIC_RULE_OBLIGATION_RELATIONS: InvocationStaticSemanticRuleObligationContract['relations'] = [
  { ruleId: 'static-source-subject-presence', obligationKinds: [], applicability: 'source-subject-must-exist-exactly-once', witnessOutcome: 'established-only' },
  { ruleId: 'static-target-resolution', obligationKinds: ['static_callable_target_unresolved', 'static_callable_target_ambiguous'], applicability: 'unresolved-or-ambiguous-target-resolution', witnessOutcome: 'established-or-obligated' },
  { ruleId: 'static-argument-binding', obligationKinds: ['static_argument_form_unproven', 'static_argument_parameter_unresolved'], applicability: 'unique-target-and-source-arguments-present', witnessOutcome: 'established-or-obligated' },
  { ruleId: 'static-effect-projection', obligationKinds: ['static_callable_effects_unavailable'], applicability: 'unique-target-effect-contract-unavailable', witnessOutcome: 'established-or-obligated' },
  { ruleId: 'static-judgment-closure', obligationKinds: [], applicability: 'all-applicable-domain-rules-have-no-unresolved-obligations', witnessOutcome: 'closed-or-incomplete' },
];

export const INVOCATION_STATIC_SEMANTIC_RULE_OBLIGATION_CONTRACT: InvocationStaticSemanticRuleObligationContract = Object.freeze({
  kind: 'invocation_static_semantic_rule_obligation_contract',
  version: 1,
  relations: Object.freeze(INVOCATION_STATIC_SEMANTIC_RULE_OBLIGATION_RELATIONS),
  ownership: 'each-obligation-kind-is-owned-by-exactly-one-rule-and-must-not-be-reclassified-by-scanner-or-authority',
  order: 'source-presence-target-resolution-argument-binding-effect-projection-closure',
  closure: 'closed-requires-no-obligations-from-any-applicable-rule-and-incomplete-requires-at-least-one-owned-obligation',
});


/**
 * Proof-ledger contract: witnesses and obligations correlate by rule identity,
 * source subject, and stable obligation identity—not diagnostic text or array length.
 */
export interface InvocationStaticSemanticProofLedgerContract {
  readonly kind: 'invocation_static_semantic_proof_ledger_contract';
  readonly version: 2;
  readonly witnessOrder: readonly [
    'static-source-subject-presence',
    'static-target-resolution',
    'static-argument-binding',
    'static-effect-projection',
    'static-judgment-closure'
  ];
  readonly witnessApplicability: 'source-and-target-witnesses-are-mandatory-and-later-domain-witnesses-appear-only-when-their-rule-prerequisites-hold';
  readonly incompleteWitnessShape: 'incomplete-proof-is-a-closed-tuple-union-for-unresolved-target-or-resolved-target-with-binding-or-effect-obligations-and-never-contains-a-closure-witness';
  readonly witnessSubject: 'every-witness-subject-and-evidence-lineage-must-bind-to-the-exact-requested-static-invocation';
  readonly obligationIdentity: 'obligation-identities-are-unique-within-one-judgment-and-each-identity-subject-and-domain-match-the-obligation-payload';
  readonly ledgerCorrespondence: 'proof-and-aggregate-obligation-ledgers-have-identical-identities-and-order-without-omission-duplication-or-addition';
  readonly evidenceLineage: 'each-witness-and-obligation-evidence-set-is-a-nonempty-source-backed-subset-of-the-knowledge-or-declared-target-contract-evidence';
  readonly closedProof: 'closed-proof-has-all-five-applicable-witnesses-in-canonical-order-and-no-obligations';
  readonly incompleteProof: 'incomplete-proof-has-no-closure-witness-and-preserves-every-unresolved-rule-owned-obligation';
  readonly invalidHandling: 'violations-are-returned-as-typed-failures-without-repairing-or-rederiving-the-judgment';
}

const INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_WITNESS_ORDER: InvocationStaticSemanticProofLedgerContract['witnessOrder'] = [
  'static-source-subject-presence',
  'static-target-resolution',
  'static-argument-binding',
  'static-effect-projection',
  'static-judgment-closure',
];

export const INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT: InvocationStaticSemanticProofLedgerContract = Object.freeze({
  kind: 'invocation_static_semantic_proof_ledger_contract',
  version: 2,
  witnessOrder: INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_WITNESS_ORDER,
  witnessApplicability: 'source-and-target-witnesses-are-mandatory-and-later-domain-witnesses-appear-only-when-their-rule-prerequisites-hold',
  incompleteWitnessShape: 'incomplete-proof-is-a-closed-tuple-union-for-unresolved-target-or-resolved-target-with-binding-or-effect-obligations-and-never-contains-a-closure-witness',
  witnessSubject: 'every-witness-subject-and-evidence-lineage-must-bind-to-the-exact-requested-static-invocation',
  obligationIdentity: 'obligation-identities-are-unique-within-one-judgment-and-each-identity-subject-and-domain-match-the-obligation-payload',
  ledgerCorrespondence: 'proof-and-aggregate-obligation-ledgers-have-identical-identities-and-order-without-omission-duplication-or-addition',
  evidenceLineage: 'each-witness-and-obligation-evidence-set-is-a-nonempty-source-backed-subset-of-the-knowledge-or-declared-target-contract-evidence',
  closedProof: 'closed-proof-has-all-five-applicable-witnesses-in-canonical-order-and-no-obligations',
  incompleteProof: 'incomplete-proof-has-no-closure-witness-and-preserves-every-unresolved-rule-owned-obligation',
  invalidHandling: 'violations-are-returned-as-typed-failures-without-repairing-or-rederiving-the-judgment',
});

/** Proof witness is rule-owned and bound to the exact static source subject. */
export interface InvocationStaticSemanticRuleWitness {
  readonly kind: 'invocation_static_semantic_rule_witness';
  readonly ruleId: InvocationStaticSemanticRuleId;
  readonly subject: KnowledgeId;
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
  readonly outcome: 'established' | 'obligated' | 'closed' | 'incomplete';
}

/** Closed proof has one witness for each required domain rule, in canonical order. */
export interface InvocationStaticClosedProofReceipt {
  readonly kind: 'invocation_static_semantic_proof';
  readonly status: 'closed';
  readonly subject: SemanticStaticInvocation;
  readonly target: SemanticCallable;
  /** A closed proof cannot carry unresolved obligations. */
  readonly obligations: readonly [];
  readonly witnesses: readonly [
    InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-source-subject-presence'; readonly outcome: 'established' }>,
    InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-target-resolution'; readonly outcome: 'established' }>,
    InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-argument-binding'; readonly outcome: 'established' }>,
    InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-effect-projection'; readonly outcome: 'established' }>,
    InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-judgment-closure'; readonly outcome: 'closed' }>
  ];
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
}

type InvocationStaticSourcePresenceWitness = InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-source-subject-presence'; readonly outcome: 'established' }>;
type InvocationStaticTargetEstablishedWitness = InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-target-resolution'; readonly outcome: 'established' }>;
type InvocationStaticTargetObligatedWitness = InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-target-resolution'; readonly outcome: 'obligated' }>;
type InvocationStaticBindingEstablishedWitness = InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-argument-binding'; readonly outcome: 'established' }>;
type InvocationStaticBindingObligatedWitness = InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-argument-binding'; readonly outcome: 'obligated' }>;
type InvocationStaticEffectsEstablishedWitness = InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-effect-projection'; readonly outcome: 'established' }>;
type InvocationStaticEffectsObligatedWitness = InvocationStaticSemanticRuleWitness & Readonly<{ readonly ruleId: 'static-effect-projection'; readonly outcome: 'obligated' }>;

/**
 * An incomplete proof is a closed set of legal witness sequences. The tuple union
 * excludes duplicate/out-of-order witnesses and makes a closure witness unrepresentable.
 */
export type InvocationStaticIncompleteProofWitnessSequence =
  | readonly [InvocationStaticSourcePresenceWitness, InvocationStaticTargetObligatedWitness]
  | readonly [InvocationStaticSourcePresenceWitness, InvocationStaticTargetEstablishedWitness, InvocationStaticEffectsObligatedWitness]
  | readonly [InvocationStaticSourcePresenceWitness, InvocationStaticTargetEstablishedWitness, InvocationStaticBindingObligatedWitness, InvocationStaticEffectsEstablishedWitness]
  | readonly [InvocationStaticSourcePresenceWitness, InvocationStaticTargetEstablishedWitness, InvocationStaticBindingObligatedWitness, InvocationStaticEffectsObligatedWitness]
  | readonly [InvocationStaticSourcePresenceWitness, InvocationStaticTargetEstablishedWitness, InvocationStaticBindingEstablishedWitness, InvocationStaticEffectsObligatedWitness];

/** Incomplete proof keeps established rule witnesses and unresolved domain obligations. */
export interface InvocationStaticIncompleteProofReceipt {
  readonly kind: 'invocation_static_semantic_proof';
  readonly status: 'incomplete';
  readonly subject: SemanticStaticInvocation;
  /** Mandatory source and target witnesses prevent a proof from starting mid-derivation. */
  readonly witnesses: InvocationStaticIncompleteProofWitnessSequence;
  /** Exact obligation ledger mirrored by the aggregate judgment, in the same order. */
  readonly obligations: readonly [InvocationStaticSemanticObligation, ...InvocationStaticSemanticObligation[]];
  readonly evidence: readonly [SemanticSource, ...SemanticSource[]];
}

export type InvocationStaticSemanticProofReceipt = InvocationStaticClosedProofReceipt | InvocationStaticIncompleteProofReceipt;

/** Validation failures are typed domain violations; the validator must never repair the judgment. */
export type InvocationStaticSemanticAuthorityViolationCode =
  | 'subject-not-present-in-source-knowledge'
  | 'subject-identity-mismatch'
  | 'subjudgment-subject-mismatch'
  | 'target-candidate-cardinality-invalid'
  | 'argument-disposition-coverage-invalid'
  | 'argument-binding-target-mismatch'
  | 'effect-target-mismatch'
  | 'effect-channel-provenance-invalid'
  | 'proof-witness-order-invalid'
  | 'applicable-rule-witness-missing'
  | 'non-applicable-rule-witness-present'
  | 'proof-obligation-ledger-order-invalid'
  | 'duplicate-obligation-identity'
  | 'proof-witness-evidence-unanchored'
  | 'obligation-identity-invalid'
  | 'rule-obligation-correspondence-invalid'
  | 'proof-judgment-obligation-ledger-mismatch'
  | 'closed-judgment-prerequisite-unmet'
  | 'incomplete-judgment-without-obligation'
  | 'evidence-provenance-invalid';

export interface InvocationStaticSemanticAuthorityViolation {
  readonly kind: 'invocation_static_semantic_authority_violation';
  readonly code: InvocationStaticSemanticAuthorityViolationCode;
  readonly subject: KnowledgeId;
  readonly rule: InvocationStaticSemanticRuleId | 'source-identity' | 'obligation-ledger' | 'evidence-provenance';
  readonly detail: string;
  /** Empty only when the failed invariant is structural and has no source witness. */
  readonly evidence: readonly SemanticSource[];
}

/** Receipt is emitted only after validation; it is not a substitute for the domain proof. */
export interface InvocationStaticSemanticAuthorityValidationReceipt {
  readonly kind: 'invocation_static_semantic_authority_validation_receipt';
  readonly contractVersion: 9;
  readonly subject: KnowledgeId;
  readonly judgmentStatus: 'closed' | 'incomplete';
  readonly obligationIdentities: readonly KnowledgeId[];
  readonly witnessRules: readonly InvocationStaticSemanticRuleId[];
  readonly validation: 'all-declared-invariants-satisfied';
}

export type InvocationStaticSemanticAuthorityValidationResult =
  | Readonly<{
      readonly kind: 'valid';
      readonly judgment: InvocationStaticSemanticJudgment;
      readonly receipt: InvocationStaticSemanticAuthorityValidationReceipt;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly subject: KnowledgeId;
      readonly violations: readonly [InvocationStaticSemanticAuthorityViolation, ...InvocationStaticSemanticAuthorityViolation[]];
    }>;

export interface InvocationStaticSemanticAuthorityValidationInput {
  /** Authority receives the exact algebra-derived, context-bound final judgment envelope. */
  readonly derivation: Extract<InvocationStaticSemanticAlgebraResult, { readonly kind: 'derived' }>;
}

/** Interface-first authority boundary: validates existing derivation, never re-derives or repairs it. */
export interface InvocationStaticSemanticAuthorityValidationInterface {
  readonly kind: 'invocation_static_semantic_authority_validation';
  readonly contract: InvocationStaticSemanticAuthorityValidationContract;
  readonly validate: (input: InvocationStaticSemanticAuthorityValidationInput) => InvocationStaticSemanticAuthorityValidationResult;
}

export interface InvocationStaticSemanticAuthorityValidationContract {
  readonly kind: 'invocation_static_semantic_authority_validation_contract';
  readonly version: 9;
  readonly ruleObligationContract: InvocationStaticSemanticRuleObligationContract;
  readonly proofLedgerContract: InvocationStaticSemanticProofLedgerContract;
  readonly derivationHandoff: 'authority-accepts-only-a-derived-candidate-that-carries-the-exact-context-bound-judgment-used-by-algebra';
  readonly sourceKnowledgeBinding: 'authority-reads-the-context-bound-judgment-from-the-derived-envelope-and-cannot-pair-it-with-an-independent-snapshot-subject-or-detached-judgment';
  readonly sourceIdentity: 'exactly-one-static-invocation-fact-must-match-the-derived-candidate-subject-id-and-source-evidence';
  readonly subjectCorrelation: 'derived-candidate-target-binding-effects-and-proof-must-share-the-same-static-invocation-identity';
  readonly targetCardinality: 'resolved-one-distinct-callable-unresolved-zero-candidates-ambiguous-at-least-two-distinct-callables';
  readonly argumentCoverage: 'one-ordered-disposition-per-source-argument-with-no-loss-duplication-or-cross-subject-binding';
  readonly effectOwnership: 'projected-result-and-exception-emissions-must-belong-to-the-uniquely-resolved-callable-and-preserve-distinct-channels';
  readonly effectUnavailability: 'a-resolved-target-without-source-established-effect-contract-produces-an-explicit-effect-projection-obligation-and-no-emissions';
  readonly evidenceProvenance: 'every-semantic-claim-and-witness-must-be-supported-by-source-evidence-present-in-upstream-knowledge-or-its-declared-target-contract';
  readonly ruleObligationCorrespondence: 'target-resolution-obligations-cover-unresolved-or-ambiguous-targets-argument-form-obligations-cover-unproven-forms-parameter-obligations-cover-unbound-positions-effect-obligations-cover-unestablished-effects-and-cannot-be-discarded';
  readonly proofWitnessOrder: 'source-presence-target-resolution-argument-binding-effect-projection-closure-with-only-applicable-established-rules';
  readonly obligationLedger: 'proof-and-judgment-obligations-have-identical-stable-identities-in-identical-order';
  readonly closedJudgment: 'unique-target-complete-binding-projected-effects-empty-obligation-ledger-and-closed-proof';
  readonly incompleteJudgment: 'at-least-one-source-backed-obligation-and-incomplete-proof-without-fabricated-closure';
  readonly invalidHandling: 'return-typed-violations-without-repairing-judgment-or-inventing-evidence';
  readonly semanticOwnership: 'validate-domain-algebra-output-without-rederiving-semantic-meaning';
  readonly runtimeStatus: 'contract-only-static-authority-validator-not-yet-implemented';
}

export const INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT: InvocationStaticSemanticAuthorityValidationContract = Object.freeze({
  kind: 'invocation_static_semantic_authority_validation_contract',
  version: 9,
  ruleObligationContract: INVOCATION_STATIC_SEMANTIC_RULE_OBLIGATION_CONTRACT,
  proofLedgerContract: INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT,
  derivationHandoff: 'authority-accepts-only-a-derived-candidate-that-carries-the-exact-context-bound-judgment-used-by-algebra',
  sourceKnowledgeBinding: 'authority-reads-the-context-bound-judgment-from-the-derived-envelope-and-cannot-pair-it-with-an-independent-snapshot-subject-or-detached-judgment',
  sourceIdentity: 'exactly-one-static-invocation-fact-must-match-the-derived-candidate-subject-id-and-source-evidence',
  subjectCorrelation: 'derived-candidate-target-binding-effects-and-proof-must-share-the-same-static-invocation-identity',
  targetCardinality: 'resolved-one-distinct-callable-unresolved-zero-candidates-ambiguous-at-least-two-distinct-callables',
  argumentCoverage: 'one-ordered-disposition-per-source-argument-with-no-loss-duplication-or-cross-subject-binding',
  effectOwnership: 'projected-result-and-exception-emissions-must-belong-to-the-uniquely-resolved-callable-and-preserve-distinct-channels',
  effectUnavailability: 'a-resolved-target-without-source-established-effect-contract-produces-an-explicit-effect-projection-obligation-and-no-emissions',
  evidenceProvenance: 'every-semantic-claim-and-witness-must-be-supported-by-source-evidence-present-in-upstream-knowledge-or-its-declared-target-contract',
  ruleObligationCorrespondence: 'target-resolution-obligations-cover-unresolved-or-ambiguous-targets-argument-form-obligations-cover-unproven-forms-parameter-obligations-cover-unbound-positions-effect-obligations-cover-unestablished-effects-and-cannot-be-discarded',
  proofWitnessOrder: 'source-presence-target-resolution-argument-binding-effect-projection-closure-with-only-applicable-established-rules',
  obligationLedger: 'proof-and-judgment-obligations-have-identical-stable-identities-in-identical-order',
  closedJudgment: 'unique-target-complete-binding-projected-effects-empty-obligation-ledger-and-closed-proof',
  incompleteJudgment: 'at-least-one-source-backed-obligation-and-incomplete-proof-without-fabricated-closure',
  invalidHandling: 'return-typed-violations-without-repairing-judgment-or-inventing-evidence',
  semanticOwnership: 'validate-domain-algebra-output-without-rederiving-semantic-meaning',
  runtimeStatus: 'contract-only-static-authority-validator-not-yet-implemented',
});

/**
 * Aggregate judgment for one static invocation. A closed result is constructible only
 * when target resolution, argument binding, effect projection and the rule-owned proof
 * receipt are all complete. Every other state must preserve at least one obligation.
 * This is a type contract; no current runtime implementation is implied.
 */
export type InvocationStaticSemanticJudgment =
  | Readonly<{
      readonly kind: 'invocation_static_semantic_judgment';
      readonly status: 'closed';
      readonly subject: SemanticStaticInvocation;
      readonly targetResolution: Extract<InvocationStaticTargetResolution, { readonly kind: 'resolved' }>;
      readonly argumentBinding: Extract<InvocationStaticArgumentBindingJudgment, { readonly kind: 'not-required' | 'established' }>;
      readonly effects: Extract<InvocationStaticEffectProjectionJudgment, { readonly kind: 'effects-projected' }>;
      readonly obligations: readonly [];
      readonly proof: InvocationStaticClosedProofReceipt;
    }>
  | Readonly<{
      readonly kind: 'invocation_static_semantic_judgment';
      readonly status: 'incomplete';
      readonly subject: SemanticStaticInvocation;
      readonly targetResolution: InvocationStaticTargetResolution;
      readonly argumentBinding: InvocationStaticArgumentBindingJudgment;
      readonly effects: InvocationStaticEffectProjectionJudgment;
      readonly obligations: readonly [InvocationStaticSemanticObligation, ...InvocationStaticSemanticObligation[]];
      readonly proof: InvocationStaticIncompleteProofReceipt;
    }>;

/**
 * Input to static invocation derivation. The requested subject remains a static
 * invocation and must be present exactly once in the supplied source knowledge.
 */
export interface InvocationStaticSemanticAlgebraInput {
  readonly knowledge: SemanticKnowledgeDataFlow;
  readonly subject: SemanticStaticInvocation;
}

/** Invalid source identity is an input rejection, never an incomplete semantic judgment. */
export type InvocationStaticSemanticAlgebraResult =
  | Readonly<{
      readonly kind: 'derived';
      /** The exact source snapshot and uniquely resolved subject travel with the final domain judgment. */
      readonly candidate: InvocationStaticSemanticJudgmentCandidate;
    }>
  | Readonly<{
      readonly kind: 'rejected-input';
      readonly requestedSubject: KnowledgeId;
      readonly reason: 'subject-not-found' | 'subject-source-mismatch' | 'subject-identity-ambiguous';
    }>;

/** Subject-presence result is a typed input gate, not an exception or fabricated judgment. */
export interface InvocationStaticResolvedSourceContext {
  readonly kind: 'invocation_static_resolved_source_context';
  /** The source knowledge and the uniquely matched static invocation travel together. */
  readonly knowledge: SemanticKnowledgeDataFlow;
  readonly subject: SemanticStaticInvocation;
}

/**
 * Stage outputs have domain-owned types rather than a generic judgment slot.
 * The field names identify the semantic rule result, so a target resolution cannot
 * be substituted for binding, effects, positional evidence, or the final judgment.
 * Context object identity and evidence provenance remain authority-validated invariants.
 */
export interface InvocationStaticPositionalEvidenceJudgment {
  readonly kind: 'invocation_static_positional_evidence_judgment';
  readonly context: InvocationStaticResolvedSourceContext;
  readonly evidenceJudgment: InvocationStaticPositionalEvidenceResult;
}

export interface InvocationStaticTargetResolutionJudgment {
  readonly kind: 'invocation_static_target_resolution_judgment';
  readonly context: InvocationStaticResolvedSourceContext;
  readonly resolution: InvocationStaticTargetResolution;
}

export interface InvocationStaticArgumentBindingStageJudgment {
  readonly kind: 'invocation_static_argument_binding_judgment';
  readonly context: InvocationStaticResolvedSourceContext;
  readonly binding: InvocationStaticArgumentBindingJudgment;
}

export interface InvocationStaticEffectProjectionStageJudgment {
  readonly kind: 'invocation_static_effect_projection_judgment';
  readonly context: InvocationStaticResolvedSourceContext;
  readonly projection: InvocationStaticEffectProjectionJudgment;
}

export interface InvocationStaticSemanticJudgmentCandidate {
  readonly kind: 'invocation_static_semantic_judgment_candidate';
  readonly context: InvocationStaticResolvedSourceContext;
  readonly judgment: InvocationStaticSemanticJudgment;
}

export type InvocationStaticSubjectPresenceResult =
  | Readonly<{ readonly kind: 'present'; readonly context: InvocationStaticResolvedSourceContext }>
  | Readonly<{
      readonly kind: 'rejected';
      readonly requestedSubject: KnowledgeId;
      readonly reason: 'subject-not-found' | 'subject-source-mismatch' | 'subject-identity-ambiguous';
    }>;

export interface InvocationStaticSubjectPresenceInput {
  readonly knowledge: SemanticKnowledgeDataFlow;
  readonly subject: SemanticStaticInvocation;
}

export interface InvocationStaticSubjectPresenceInterface {
  readonly kind: 'invocation_static_subject_presence';
  readonly resolve: (input: InvocationStaticSubjectPresenceInput) => InvocationStaticSubjectPresenceResult;
}

/** Positional-form evidence is represented as a domain result, not an untyped missing-value sentinel. */
export type InvocationStaticPositionalEvidenceResult =
  | Readonly<{
      readonly kind: 'confirmed-positional-evidence';
      readonly evidence: InvocationStaticPositionalArgumentEvidence;
    }>
  | Readonly<{
      readonly kind: 'positional-evidence-unavailable';
      readonly subject: KnowledgeId;
      readonly reason: 'normalization-not-source-established';
    }>
  | Readonly<{ readonly kind: 'positional-evidence-not-required'; readonly subject: KnowledgeId }>
  | Readonly<{ readonly kind: 'positional-evidence-not-assessable'; readonly subject: KnowledgeId; readonly reason: 'target-unresolved' | 'target-ambiguous' }>;

export interface InvocationStaticPositionalEvidenceInput {
  readonly context: InvocationStaticResolvedSourceContext;
}

export interface InvocationStaticPositionalEvidenceInterface {
  readonly kind: 'invocation_static_positional_evidence';
  readonly resolve: (input: InvocationStaticPositionalEvidenceInput) => InvocationStaticPositionalEvidenceJudgment;
}

/** Input boundary for the class/operation candidate rule; no argument or effect judgment is accepted here. */
export interface InvocationStaticTargetResolutionAlgebraInput {
  readonly context: InvocationStaticResolvedSourceContext;
}

export interface InvocationStaticTargetResolutionAlgebraInterface {
  readonly kind: 'invocation_static_target_resolution_algebra';
  readonly contract: InvocationStaticTargetResolutionContract;
  readonly resolve: (input: InvocationStaticTargetResolutionAlgebraInput) => InvocationStaticTargetResolutionJudgment;
}

/** Binding consumes context-bound judgments, never a detached target or positional result. */
export interface InvocationStaticArgumentBindingAlgebraInput {
  readonly targetResolution: InvocationStaticTargetResolutionJudgment;
  readonly positionalEvidence: InvocationStaticPositionalEvidenceJudgment;
}

export interface InvocationStaticArgumentBindingAlgebraInterface {
  readonly kind: 'invocation_static_argument_binding_algebra';
  readonly contract: InvocationStaticArgumentAndEffectContract;
  readonly bind: (input: InvocationStaticArgumentBindingAlgebraInput) => InvocationStaticArgumentBindingStageJudgment;
}

/** Effect projection consumes the context-bound target result and cannot select another target. */
export interface InvocationStaticEffectProjectionAlgebraInput {
  readonly targetResolution: InvocationStaticTargetResolutionJudgment;
}

export interface InvocationStaticEffectProjectionAlgebraInterface {
  readonly kind: 'invocation_static_effect_projection_algebra';
  readonly contract: InvocationStaticArgumentAndEffectContract;
  readonly project: (input: InvocationStaticEffectProjectionAlgebraInput) => InvocationStaticEffectProjectionStageJudgment;
}

/** Proof assembly consumes context-bound stage outputs and may not re-resolve their semantics. */
export interface InvocationStaticJudgmentAssemblyInput {
  readonly targetResolution: InvocationStaticTargetResolutionJudgment;
  readonly argumentBinding: InvocationStaticArgumentBindingStageJudgment;
  readonly effects: InvocationStaticEffectProjectionStageJudgment;
}

export interface InvocationStaticJudgmentAssemblyInterface {
  readonly kind: 'invocation_static_judgment_assembly';
  readonly contract: InvocationStaticSemanticJudgmentContract;
  readonly assemble: (input: InvocationStaticJudgmentAssemblyInput) => InvocationStaticSemanticJudgmentCandidate;
}

/**
 * The static algebra derives a complete candidate judgment by composing rule-owned
 * stages. The stages are independently typed so binding cannot resolve targets, effects
 * cannot replace targets, and proof assembly cannot repeat earlier semantic reasoning.
 */
export interface InvocationStaticSemanticAlgebraInterface {
  readonly kind: 'invocation_static_semantic_algebra';
  readonly contract: InvocationStaticSemanticAlgebraContract;
  readonly targetResolution: InvocationStaticTargetResolutionAlgebraInterface;
  readonly argumentBinding: InvocationStaticArgumentBindingAlgebraInterface;
  readonly effectProjection: InvocationStaticEffectProjectionAlgebraInterface;
  readonly judgmentAssembly: InvocationStaticJudgmentAssemblyInterface;
  readonly subjectPresence: InvocationStaticSubjectPresenceInterface;
  readonly positionalEvidence: InvocationStaticPositionalEvidenceInterface;
  readonly derive: (input: InvocationStaticSemanticAlgebraInput) => InvocationStaticSemanticAlgebraResult;
}

/**
 * Executable specification for the not-yet-implemented static invocation algebra.
 * It fixes derivation inputs, rule order, output ownership, and the authority handoff.
 */
export interface InvocationStaticSemanticAlgebraContract {
  readonly kind: 'invocation_static_semantic_algebra_contract';
  readonly version: 6;
  readonly inputIdentity: 'requested-subject-must-match-exactly-one-static-invocation-in-source-knowledge';
  readonly sourceContext: 'subject-presence-produces-one-context-containing-the-exact-knowledge-snapshot-and-uniquely-matched-static-subject';
  readonly stageOutputBinding: 'each-rule-returns-its-domain-specific-stage-judgment-with-source-context-and-downstream-rules-consume-only-the-required-stage-judgments';
  readonly sourceVocabulary: 'derive-only-from-static-invocation-facts-and-never-coerce-to-ordinary-invocation';
  readonly stageOwnership: 'subject-presence-creates-one-source-bound-context-consumed-by-positional-evidence-target-resolution-argument-binding-effect-projection-and-judgment-assembly';
  readonly invalidSubject: 'missing-mismatched-or-ambiguous-source-subject-is-a-typed-input-rejection-not-an-incomplete-judgment';
  readonly positionalEvidence: 'argument-binding-receives-a-typed-confirmed-or-unavailable-positional-evidence-result';
  readonly targetResolutionInput: 'resolve-only-the-static-subject-class-operation-pair-from-source-knowledge';
  readonly bindingInput: 'consume-the-existing-target-judgment-and-positional-evidence-without-resolving-a-target-again';
  readonly effectInput: 'consume-the-existing-target-judgment-and-never-select-or-substitute-a-target';
  readonly assemblyInput: 'consume-completed-subjudgments-and-assemble-proof-and-obligations-without-rederiving-subjudgments';
  readonly derivationOrder: 'source-subject-presence-target-resolution-argument-binding-effect-projection-proof-assembly';
  readonly targetResolution: 'derive-class-operation-pair-cardinality-with-candidate-specific-source-evidence';
  readonly argumentBinding: 'derive-only-for-unique-target-and-source-established-positional-normalization';
  readonly effectProjection: 'project-only-target-owned-result-and-exception-emissions-or-preserve-effect-obligation';
  readonly proofAssembly: 'assemble-subject-bound-rule-witnesses-and-the-exact-obligation-ledger-in-canonical-order';
  readonly outputMeaning: 'return-a-derived-candidate-judgment-bound-to-the-exact-source-knowledge-snapshot-or-a-typed-input-rejection-without-claiming-authority-validation';
  readonly sourceSnapshotHandoff: 'all-domain-specific-stage-judgments-retain-source-context-and-the-final-judgment-candidate-carries-context-to-authority';
  readonly authorityHandoff: 'authority-validates-the-derived-judgment-without-rederiving-or-repairing-it';
  readonly scannerBoundary: 'scanner-collects-source-knowledge-and-delegates-without-semantic-reasoning';
  readonly runtimeStatus: 'interface-contract-only-static-algebra-implementation-not-yet-present';
}

export const INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT: InvocationStaticSemanticAlgebraContract = Object.freeze({
  kind: 'invocation_static_semantic_algebra_contract',
  version: 6,
  inputIdentity: 'requested-subject-must-match-exactly-one-static-invocation-in-source-knowledge',
  sourceContext: 'subject-presence-produces-one-context-containing-the-exact-knowledge-snapshot-and-uniquely-matched-static-subject',
  stageOutputBinding: 'each-rule-returns-its-domain-specific-stage-judgment-with-source-context-and-downstream-rules-consume-only-the-required-stage-judgments',
  sourceVocabulary: 'derive-only-from-static-invocation-facts-and-never-coerce-to-ordinary-invocation',
  stageOwnership: 'subject-presence-creates-one-source-bound-context-consumed-by-positional-evidence-target-resolution-argument-binding-effect-projection-and-judgment-assembly',
  invalidSubject: 'missing-mismatched-or-ambiguous-source-subject-is-a-typed-input-rejection-not-an-incomplete-judgment',
  positionalEvidence: 'argument-binding-receives-a-typed-confirmed-or-unavailable-positional-evidence-result',
  targetResolutionInput: 'resolve-only-the-static-subject-class-operation-pair-from-source-knowledge',
  bindingInput: 'consume-the-existing-target-judgment-and-positional-evidence-without-resolving-a-target-again',
  effectInput: 'consume-the-existing-target-judgment-and-never-select-or-substitute-a-target',
  assemblyInput: 'consume-completed-subjudgments-and-assemble-proof-and-obligations-without-rederiving-subjudgments',
  derivationOrder: 'source-subject-presence-target-resolution-argument-binding-effect-projection-proof-assembly',
  targetResolution: 'derive-class-operation-pair-cardinality-with-candidate-specific-source-evidence',
  argumentBinding: 'derive-only-for-unique-target-and-source-established-positional-normalization',
  effectProjection: 'project-only-target-owned-result-and-exception-emissions-or-preserve-effect-obligation',
  proofAssembly: 'assemble-subject-bound-rule-witnesses-and-the-exact-obligation-ledger-in-canonical-order',
  outputMeaning: 'return-a-derived-candidate-judgment-bound-to-the-exact-source-knowledge-snapshot-or-a-typed-input-rejection-without-claiming-authority-validation',
  sourceSnapshotHandoff: 'all-domain-specific-stage-judgments-retain-source-context-and-the-final-judgment-candidate-carries-context-to-authority',
  authorityHandoff: 'authority-validates-the-derived-judgment-without-rederiving-or-repairing-it',
  scannerBoundary: 'scanner-collects-source-knowledge-and-delegates-without-semantic-reasoning',
  runtimeStatus: 'interface-contract-only-static-algebra-implementation-not-yet-present',
});

/**
 * Closed compatibility matrix for aggregate static-call judgments. It defines which
 * combinations of target, binding, effect and aggregate outcomes are semantically
 * admissible; the authority must reject combinations outside this matrix, never repair
 * them or infer a different outcome from partial fields.
 */
export type InvocationStaticJudgmentCompatibilityRelation =
  | Readonly<{
      readonly target: 'unresolved';
      readonly binding: 'blocked';
      readonly effects: 'effects-unavailable';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'target-resolution';
    }>
  | Readonly<{
      readonly target: 'ambiguous';
      readonly binding: 'blocked';
      readonly effects: 'effects-unavailable';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'target-resolution';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'not-required';
      readonly effects: 'effects-projected';
      readonly aggregate: 'closed';
      readonly obligationSource: 'none';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'established';
      readonly effects: 'effects-projected';
      readonly aggregate: 'closed';
      readonly obligationSource: 'none';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'not-required';
      readonly effects: 'effects-unavailable';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'effect-projection';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'established';
      readonly effects: 'effects-unavailable';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'effect-projection';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'incomplete';
      readonly effects: 'effects-projected';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'argument-binding';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'incomplete';
      readonly effects: 'effects-unavailable';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'argument-binding-and-effect-projection';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'argument-form-unproven';
      readonly effects: 'effects-projected';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'argument-binding';
    }>
  | Readonly<{
      readonly target: 'resolved';
      readonly binding: 'argument-form-unproven';
      readonly effects: 'effects-unavailable';
      readonly aggregate: 'incomplete';
      readonly obligationSource: 'argument-binding-and-effect-projection';
    }>;

export interface InvocationStaticJudgmentCompatibilityContract {
  readonly kind: 'invocation_static_judgment_compatibility_contract';
  readonly version: 1;
  readonly relations: readonly [
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'unresolved' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'ambiguous' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'not-required'; readonly effects: 'effects-projected' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'established'; readonly effects: 'effects-projected' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'not-required'; readonly effects: 'effects-unavailable' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'established'; readonly effects: 'effects-unavailable' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'incomplete'; readonly effects: 'effects-projected' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'incomplete'; readonly effects: 'effects-unavailable' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'argument-form-unproven'; readonly effects: 'effects-projected' }>,
    Extract<InvocationStaticJudgmentCompatibilityRelation, { readonly target: 'resolved'; readonly binding: 'argument-form-unproven'; readonly effects: 'effects-unavailable' }>
  ];
  readonly completeness: 'every-target-binding-effect-aggregate-combination-must-match-exactly-one-relation';
  readonly rejection: 'unmatched-or-multiply-matched-combination-is-a-typed-authority-violation-and-is-never-repaired';
  readonly closure: 'closed-is-equivalent-to-resolved-target-established-or-not-required-binding-projected-effects-and-empty-obligation-ledger';
  readonly incomplete: 'incomplete-requires-at-least-one-obligation-owned-by-a-rule-applicable-to-the-matched-relation';
}

const INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_RELATIONS: InvocationStaticJudgmentCompatibilityContract['relations'] = [
  { target: 'unresolved', binding: 'blocked', effects: 'effects-unavailable', aggregate: 'incomplete', obligationSource: 'target-resolution' },
  { target: 'ambiguous', binding: 'blocked', effects: 'effects-unavailable', aggregate: 'incomplete', obligationSource: 'target-resolution' },
  { target: 'resolved', binding: 'not-required', effects: 'effects-projected', aggregate: 'closed', obligationSource: 'none' },
  { target: 'resolved', binding: 'established', effects: 'effects-projected', aggregate: 'closed', obligationSource: 'none' },
  { target: 'resolved', binding: 'not-required', effects: 'effects-unavailable', aggregate: 'incomplete', obligationSource: 'effect-projection' },
  { target: 'resolved', binding: 'established', effects: 'effects-unavailable', aggregate: 'incomplete', obligationSource: 'effect-projection' },
  { target: 'resolved', binding: 'incomplete', effects: 'effects-projected', aggregate: 'incomplete', obligationSource: 'argument-binding' },
  { target: 'resolved', binding: 'incomplete', effects: 'effects-unavailable', aggregate: 'incomplete', obligationSource: 'argument-binding-and-effect-projection' },
  { target: 'resolved', binding: 'argument-form-unproven', effects: 'effects-projected', aggregate: 'incomplete', obligationSource: 'argument-binding' },
  { target: 'resolved', binding: 'argument-form-unproven', effects: 'effects-unavailable', aggregate: 'incomplete', obligationSource: 'argument-binding-and-effect-projection' },
];

export const INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT: InvocationStaticJudgmentCompatibilityContract = Object.freeze({
  kind: 'invocation_static_judgment_compatibility_contract',
  version: 1,
  relations: Object.freeze(INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_RELATIONS),
  completeness: 'every-target-binding-effect-aggregate-combination-must-match-exactly-one-relation',
  rejection: 'unmatched-or-multiply-matched-combination-is-a-typed-authority-violation-and-is-never-repaired',
  closure: 'closed-is-equivalent-to-resolved-target-established-or-not-required-binding-projected-effects-and-empty-obligation-ledger',
  incomplete: 'incomplete-requires-at-least-one-obligation-owned-by-a-rule-applicable-to-the-matched-relation',
});

export interface InvocationStaticSemanticJudgmentContract {
  readonly kind: 'invocation_static_semantic_judgment_contract';
  readonly version: 11;
  readonly proofLedgerContract: InvocationStaticSemanticProofLedgerContract;
  readonly algebraContract: InvocationStaticSemanticAlgebraContract;
  readonly compatibility: InvocationStaticJudgmentCompatibilityContract;
  readonly subjectCorrelation: 'aggregate-subjudgments-and-proof-must-reference-the-identical-static-subject';
  readonly closedPrerequisites: 'resolved-target-plus-established-or-not-required-binding-plus-projected-effects-plus-complete-ordered-proof-witnesses';
  readonly incompletePrerequisite: 'at-least-one-source-backed-domain-obligation-and-incomplete-proof-receipt';
  readonly obligationCoverage: 'every-unresolved-target-binding-or-effect-precondition-is-preserved-without-loss';
  readonly proofWitnessOwnership: 'source-presence-witness-first-target-resolution-witness-second-one-subject-bound-source-backed-witness-per-applicable-rule-and-closure-witness-last';
  readonly proofObligationCorrespondence: 'incomplete-proof-and-aggregate-judgment-carry-the-same-stable-obligation-identities-in-the-same-order-and-closed-proof-carries-none';
  readonly authorityValidation: 'validate-rule-order-evidence-lineage-target-binding-effects-and-obligation-completeness-before-return';
  readonly runtimeStatus: 'contract-only-static-judgment-algebra-and-authority-not-yet-implemented';
}

export const INVOCATION_STATIC_SEMANTIC_JUDGMENT_CONTRACT: InvocationStaticSemanticJudgmentContract = Object.freeze({
  kind: 'invocation_static_semantic_judgment_contract',
  version: 11,
  proofLedgerContract: INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT,
  algebraContract: INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT,
  compatibility: INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT,
  subjectCorrelation: 'aggregate-subjudgments-and-proof-must-reference-the-identical-static-subject',
  closedPrerequisites: 'resolved-target-plus-established-or-not-required-binding-plus-projected-effects-plus-complete-ordered-proof-witnesses',
  incompletePrerequisite: 'at-least-one-source-backed-domain-obligation-and-incomplete-proof-receipt',
  obligationCoverage: 'every-unresolved-target-binding-or-effect-precondition-is-preserved-without-loss',
  proofObligationCorrespondence: 'incomplete-proof-and-aggregate-judgment-carry-the-same-stable-obligation-identities-in-the-same-order-and-closed-proof-carries-none',
  proofWitnessOwnership: 'source-presence-witness-first-target-resolution-witness-second-one-subject-bound-source-backed-witness-per-applicable-rule-and-closure-witness-last',
  authorityValidation: 'validate-rule-order-evidence-lineage-target-binding-effects-and-obligation-completeness-before-return',
  runtimeStatus: 'contract-only-static-judgment-algebra-and-authority-not-yet-implemented',
});

export interface InvocationStaticJudgmentModelContract {
  readonly kind: 'invocation_static_judgment_model_contract';
  readonly version: 17;
  readonly proofLedgerContract: InvocationStaticSemanticProofLedgerContract;
  readonly algebraContract: InvocationStaticSemanticAlgebraContract;
  readonly targetResolutionContract: InvocationStaticTargetResolutionContract;
  readonly argumentAndEffectContract: InvocationStaticArgumentAndEffectContract;
  readonly aggregateJudgmentContract: InvocationStaticSemanticJudgmentContract;
  readonly compatibilityContract: InvocationStaticJudgmentCompatibilityContract;
  readonly authorityValidationContract: InvocationStaticSemanticAuthorityValidationContract;
  readonly judgmentScope: 'aggregate-static-judgment-contract-defined-but-algebra-and-authority-not-yet-implemented';
  readonly subjectIdentity: 'preserve-static-form-class-identity-operation-identity-arguments-and-source-evidence';
  readonly targetResolution: 'resolve-class-and-operation-as-a-pair-with-zero-one-or-many-candidate-outcomes';
  readonly noCoercion: 'never-invent-a-receiver-or-coerce-static-invocation-to-ordinary-invocation';
  readonly unresolvedTarget: 'retain-source-backed-unresolved-obligation-without-fabricating-a-callable';
  readonly ambiguousTarget: 'retain-all-distinct-candidates-and-candidate-specific-evidence';
  readonly argumentBinding: 'derive-only-after-target-resolution-and-explicit-argument-form-evidence';
  readonly effectProjection: 'project-only-effects-declared-by-the-resolved-static-target-and-preserve-an-obligation-when-that-contract-is-unavailable';
  readonly proofClosure: 'subject-bound-rules-witnesses-obligations-and-closure-must-be-authority-validated';
}

export const INVOCATION_STATIC_JUDGMENT_MODEL_CONTRACT: InvocationStaticJudgmentModelContract = Object.freeze({
  kind: 'invocation_static_judgment_model_contract',
  version: 17,
  proofLedgerContract: INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT,
  algebraContract: INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT,
  targetResolutionContract: INVOCATION_STATIC_TARGET_RESOLUTION_CONTRACT,
  argumentAndEffectContract: INVOCATION_STATIC_ARGUMENT_AND_EFFECT_CONTRACT,
  aggregateJudgmentContract: INVOCATION_STATIC_SEMANTIC_JUDGMENT_CONTRACT,
  compatibilityContract: INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT,
  authorityValidationContract: INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT,
  judgmentScope: 'aggregate-static-judgment-contract-defined-but-algebra-and-authority-not-yet-implemented',
  subjectIdentity: 'preserve-static-form-class-identity-operation-identity-arguments-and-source-evidence',
  targetResolution: 'resolve-class-and-operation-as-a-pair-with-zero-one-or-many-candidate-outcomes',
  noCoercion: 'never-invent-a-receiver-or-coerce-static-invocation-to-ordinary-invocation',
  unresolvedTarget: 'retain-source-backed-unresolved-obligation-without-fabricating-a-callable',
  ambiguousTarget: 'retain-all-distinct-candidates-and-candidate-specific-evidence',
  argumentBinding: 'derive-only-after-target-resolution-and-explicit-argument-form-evidence',
  effectProjection: 'project-only-effects-declared-by-the-resolved-static-target-and-preserve-an-obligation-when-that-contract-is-unavailable',
  proofClosure: 'subject-bound-rules-witnesses-obligations-and-closure-must-be-authority-validated',
});

export interface InvocationSemanticCoverageContract {
  readonly kind: 'invocation_semantic_coverage_contract';
  readonly version: 29;
  readonly staticProofLedger: InvocationStaticSemanticProofLedgerContract;
  readonly staticAlgebra: InvocationStaticSemanticAlgebraContract;
  readonly sourceVocabulary: 'ordinary-invocation-and-static-invocation-are-distinct-semantic-facts';
  readonly currentJudgmentDomain: 'ordinary-invocation-only';
  readonly inventoryIdentity: 'subject-identity-includes-source-form-and-knowledge-id';
  readonly canonicalEntryOwnership: 'subject-is-the-single-source-of-truth-for-form-knowledge-id-and-source-evidence; inventory-and-publication-entries-do-not-duplicate-identity-or-source-fields';
  readonly correspondenceIdentityOwnership: 'correspondence-has-no-duplicated-identity-field;-derive-identity-from-inventory-entry-subject-and-validate-publication-and-judgment-subjects-against-it';
  readonly inventoryCompleteness: 'every-ordinary-and-static-source-fact-appears-exactly-once-with-source-evidence';
  readonly inventoryAuthorityImplementation: 'production-inventory-authority-enumerates-ordinary-and-static-invocation-facts-from-canonical-knowledge';
  readonly publicationAuthorityImplementation: 'production-publication-authority-validates-inventory-judgment-identity-source-and-cardinality-before-issuing-a-receipt';
  readonly publicationCompleteness: 'every-source-subject-has-one-judgment-or-explicit-uncovered-disposition-and-ordinary-analysis-omissions-remain-visible';
  readonly publicationInputOwnership: 'coverage-publication-consumes-the-canonical-source-subject-inventory-and-does-not-reconstruct-inventory-from-raw-knowledge';
  readonly publicationCardinality: 'each-inventory-entry-correlates-to-exactly-one-publication-entry-and-no-publication-entry-exists-outside-the-inventory';
  readonly publicationCorrelation: 'published-judgment-subject-form-knowledge-id-and-source-span-must-match-the-canonical-subject-without-duplicated-entry-fields';
  readonly publicationValidationOutcome: 'publisher-must-return-a-validated-publication-only-after-all-correspondence-invariants-pass-or-a-non-empty-typed-rejection-ledger';
  readonly analysisCorrespondence: 'every-analysis-judgment-matches-exactly-one-ordinary-inventory-identity-and-no-judgment-exists-outside-the-inventory';
  readonly validationReceipt: 'validated-publication-includes-an-entry-by-entry-inventory-to-publication-correspondence-ledger';
  readonly publicationReceiptAuthorityBinding: 'validated-receipt-carries-the-exact-coverage-contract-and-publication-authority-boundary-that-governed-validation';
  readonly correspondenceFormAlignment: 'ordinary-inventory-subjects-correspond-only-to-ordinary-publication-entries-and-static-inventory-subjects-correspond-only-to-static-publication-entries;runtime-authority-still-validates-identity-and-source-evidence';
  readonly staticInvocationDisposition: 'preserve-as-uncovered-source-fact-until-static-algebra-and-authority-are-implemented';
  readonly staticJudgmentModel: InvocationStaticJudgmentModelContract;
  readonly staticTargetResolution: InvocationStaticTargetResolutionContract;
  readonly staticArgumentAndEffect: InvocationStaticArgumentAndEffectContract;
  readonly staticAggregateJudgment: InvocationStaticSemanticJudgmentContract;
  readonly staticJudgmentCompatibility: InvocationStaticJudgmentCompatibilityContract;
  readonly staticAuthorityValidation: InvocationStaticSemanticAuthorityValidationContract;
  readonly closureRequirement: 'implement-static-subject-target-binding-effects-proof-and-authority-before-claiming-complete-call-coverage';
}

export const INVOCATION_SEMANTIC_COVERAGE_CONTRACT: InvocationSemanticCoverageContract = Object.freeze({
  kind: 'invocation_semantic_coverage_contract',
  version: 29,
  staticProofLedger: INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT,
  staticAlgebra: INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT,
  sourceVocabulary: 'ordinary-invocation-and-static-invocation-are-distinct-semantic-facts',
  currentJudgmentDomain: 'ordinary-invocation-only',
  inventoryIdentity: 'subject-identity-includes-source-form-and-knowledge-id',
  canonicalEntryOwnership: 'subject-is-the-single-source-of-truth-for-form-knowledge-id-and-source-evidence; inventory-and-publication-entries-do-not-duplicate-identity-or-source-fields',
  correspondenceIdentityOwnership: 'correspondence-has-no-duplicated-identity-field;-derive-identity-from-inventory-entry-subject-and-validate-publication-and-judgment-subjects-against-it',
  inventoryCompleteness: 'every-ordinary-and-static-source-fact-appears-exactly-once-with-source-evidence',
  inventoryAuthorityImplementation: 'production-inventory-authority-enumerates-ordinary-and-static-invocation-facts-from-canonical-knowledge',
  publicationAuthorityImplementation: 'production-publication-authority-validates-inventory-judgment-identity-source-and-cardinality-before-issuing-a-receipt',
  publicationCompleteness: 'every-source-subject-has-one-judgment-or-explicit-uncovered-disposition-and-ordinary-analysis-omissions-remain-visible',
  publicationInputOwnership: 'coverage-publication-consumes-the-canonical-source-subject-inventory-and-does-not-reconstruct-inventory-from-raw-knowledge',
  publicationCardinality: 'each-inventory-entry-correlates-to-exactly-one-publication-entry-and-no-publication-entry-exists-outside-the-inventory',
  publicationCorrelation: 'published-judgment-subject-form-knowledge-id-and-source-span-must-match-the-canonical-subject-without-duplicated-entry-fields',
  publicationValidationOutcome: 'publisher-must-return-a-validated-publication-only-after-all-correspondence-invariants-pass-or-a-non-empty-typed-rejection-ledger',
  analysisCorrespondence: 'every-analysis-judgment-matches-exactly-one-ordinary-inventory-identity-and-no-judgment-exists-outside-the-inventory',
  validationReceipt: 'validated-publication-includes-an-entry-by-entry-inventory-to-publication-correspondence-ledger',
  publicationReceiptAuthorityBinding: 'validated-receipt-carries-the-exact-coverage-contract-and-publication-authority-boundary-that-governed-validation',
  correspondenceFormAlignment: 'ordinary-inventory-subjects-correspond-only-to-ordinary-publication-entries-and-static-inventory-subjects-correspond-only-to-static-publication-entries;runtime-authority-still-validates-identity-and-source-evidence',
  staticInvocationDisposition: 'preserve-as-uncovered-source-fact-until-static-algebra-and-authority-are-implemented',
  staticJudgmentModel: INVOCATION_STATIC_JUDGMENT_MODEL_CONTRACT,
  staticTargetResolution: INVOCATION_STATIC_TARGET_RESOLUTION_CONTRACT,
  staticArgumentAndEffect: INVOCATION_STATIC_ARGUMENT_AND_EFFECT_CONTRACT,
  staticAggregateJudgment: INVOCATION_STATIC_SEMANTIC_JUDGMENT_CONTRACT,
  staticJudgmentCompatibility: INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT,
  staticAuthorityValidation: INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT,
  closureRequirement: 'implement-static-subject-target-binding-effects-proof-and-authority-before-claiming-complete-call-coverage',
});

export interface InvocationSemanticPipelineContract {
  readonly kind: 'invocation_semantic_pipeline_contract';
  readonly version: 61;
  readonly staticProofLedger: InvocationStaticSemanticProofLedgerContract;
  readonly staticAlgebra: InvocationStaticSemanticAlgebraContract;
  /** Source-form coverage is explicit; aggregate analysis must not overclaim unsupported forms. */
  readonly coverage: InvocationSemanticCoverageContract;
  /** Canonical judgment invariants enforced by the upstream authority. */
  readonly judgmentContract: InvocationSemanticContract;
  /** Every semantic rule must satisfy its typed prerequisite-to-fact relation. */
  readonly judgmentRelationAuthority: 'rule-prerequisite-fact-obligation-witness-and-trace-ownership-must-correlate';
  /** Canonical algebra guarantees inherited by the complete pipeline boundary. */
  readonly algebraBoundary: InvocationSemanticAlgebraBoundaryContract;
  /** Authority ownership and validation obligations are part of the pipeline contract. */
  readonly authorityBoundary: InvocationSemanticAuthorityBoundaryContract;
  /** Static invocation validation remains a separate typed authority contract until implemented. */
  readonly staticAuthorityValidation: InvocationStaticSemanticAuthorityValidationContract;
  /** Intermediate and final static judgments retain their source-bound context across stage boundaries. */
  readonly staticStageBinding: 'each-static-rule-returns-a-domain-specific-context-bound-judgment-and-downstream-rules-consume-the-required-domain-judgment';
  readonly staticJudgmentCompatibility: InvocationStaticJudgmentCompatibilityContract;
  /** Runtime delegation semantics are explicit and distinct from semantic derivation. */
  readonly authorityDependencyBinding: 'pipeline-factory-injects-existing-single-invocation-and-whole-knowledge-authorities-directly-without-runtime-forwarder';
  /** Proof trace is a first-class domain contract and remains attached to the judgment. */
  readonly judgmentTrace: InvocationSemanticJudgmentTraceContract;
  /** Explicit scanner-facing boundary: collection and delegation only, no semantic reasoning. */
  readonly scannerBoundary: InvocationSemanticScannerBoundaryContract;
  /** Integrated response binds analysis and publication outcome without conflating publication validity with judgment closure. */
  readonly integratedResponse: InvocationSemanticIntegratedResponseContract;
  /** Composition boundary joins existing owners without creating a second publication authority. */
  readonly integratedResponseComposition: InvocationSemanticIntegratedResponseCompositionContract;
  /** Composition results retain the exact source knowledge graph associated with their response. */
  readonly integratedResponseCompositionSourceBinding: 'composition-consumes-the-exact-source-correlated-knowledge-projection;inventory-and-analysis-consume-its-canonical-graph;response-only-result-does-not-republish-knowledge-or-provenance';
  readonly integratedResponseCompositionDependencyBinding: 'upstream-composition-executor-injects-inventory-pipeline-and-publication-authority-through-one-typed-contract';
  /** Coverage must disclose the current ordinary-only judgment domain; static facts remain inventory-only. */
  readonly coverageDisclosure: 'ordinary-only-judgments-do-not-imply-static-invocation-coverage-and-uncovered-static-source-facts-must-remain-visible';
  readonly coveragePublicationStatus: 'inventory-and-publication-authority-implementations-present-and-integrated-response-wired-in-laravel-scanner';
  readonly integratedResponseCompositionStatus: 'inventory-and-publication-authorities-implemented-and-laravel-scanner-wired-through-integrated-response-composition';
  readonly integratedResponseCompositionMigrationGate: 'wire-after-source-inventory-ordinary-analysis-and-publication-authority-implementations-are-validated-static-subjects-remain-explicitly-uncovered';
  /** Static stage interfaces are contract-only until algebra, authority, and scanner wiring exist. */
  readonly staticImplementationStatus: 'contract-only-static-algebra-authority-coverage-publication-and-laravel-wiring-not-implemented';
  /** Complete-knowledge analysis is distinct from a list of independent invocation inputs. */
  readonly knowledgeAnalysisMeaning: 'analyze-complete-semantic-knowledge-and-preserve-individual-judgment-traces';
  readonly semanticScope: 'one-requested-invocation-and-its-relevant-semantic-dependencies';
  readonly derivationMeaning: 'complete-invocation-domain-judgment-with-target-binding-effects-proof-and-obligations';
  readonly evidenceOwnership: 'source-evidence-is-owned-upstream-and-is-never-invented-by-algebra-executor-or-scanner';
  readonly judgmentAuthority: 'only-judgments-validated-against-the-invocation-semantic-contract-may-be-returned';
  readonly closureMeaning: 'closed-only-when-applicable-domain-obligations-are-satisfied-and-proof-is-closed';
  readonly partialMeaning: 'incomplete-judgments-preserve-proven-facts-and-all-unresolved-obligations';
  readonly batchMeaning: 'one-independent-judgment-per-input-in-input-order-not-an-aggregate-knowledge-analysis';
  readonly batchCorrespondence: 'one-output-entry-per-input-in-the-same-order-with-the-same-invocation-identity';
  readonly batchIsolation: 'each-invocation-retains-its-own-evidence-judgment-and-proof';
  readonly scannerRole: 'collect-source-derived-input-and-delegate-without-semantic-reasoning';
  readonly traceRole: 'forward-authority-validated-proof-trace-without-reconstruction';
  readonly downstreamRole: 'consume-validated-judgment-without-reconstructing-semantic-meaning';
}

export const INVOCATION_SEMANTIC_PIPELINE_CONTRACT: InvocationSemanticPipelineContract = Object.freeze({
  kind: 'invocation_semantic_pipeline_contract',
  version: 61,
  staticProofLedger: INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT,
  staticAlgebra: INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT,
  coverage: INVOCATION_SEMANTIC_COVERAGE_CONTRACT,
  judgmentContract: INVOCATION_SEMANTIC_CONTRACT,
  judgmentRelationAuthority: 'rule-prerequisite-fact-obligation-witness-and-trace-ownership-must-correlate',
  algebraBoundary: INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT,
  authorityBoundary: INVOCATION_SEMANTIC_AUTHORITY_BOUNDARY_CONTRACT,
  staticAuthorityValidation: INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT,
  staticStageBinding: 'each-static-rule-returns-a-domain-specific-context-bound-judgment-and-downstream-rules-consume-the-required-domain-judgment',
  staticJudgmentCompatibility: INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT,
  authorityDependencyBinding: 'pipeline-factory-injects-existing-single-invocation-and-whole-knowledge-authorities-directly-without-runtime-forwarder',
  judgmentTrace: INVOCATION_SEMANTIC_JUDGMENT_TRACE_CONTRACT,
  scannerBoundary: INVOCATION_SEMANTIC_SCANNER_BOUNDARY_CONTRACT,
  integratedResponse: INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_CONTRACT,
  integratedResponseComposition: INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_COMPOSITION_CONTRACT,
  integratedResponseCompositionSourceBinding: 'composition-consumes-the-exact-source-correlated-knowledge-projection;inventory-and-analysis-consume-its-canonical-graph;response-only-result-does-not-republish-knowledge-or-provenance',
  integratedResponseCompositionDependencyBinding: 'upstream-composition-executor-injects-inventory-pipeline-and-publication-authority-through-one-typed-contract',
  coverageDisclosure: 'ordinary-only-judgments-do-not-imply-static-invocation-coverage-and-uncovered-static-source-facts-must-remain-visible',
  coveragePublicationStatus: 'inventory-and-publication-authority-implementations-present-and-integrated-response-wired-in-laravel-scanner',
  integratedResponseCompositionStatus: 'inventory-and-publication-authorities-implemented-and-laravel-scanner-wired-through-integrated-response-composition',
  integratedResponseCompositionMigrationGate: 'wire-after-source-inventory-ordinary-analysis-and-publication-authority-implementations-are-validated-static-subjects-remain-explicitly-uncovered',
  staticImplementationStatus: 'contract-only-static-algebra-authority-coverage-publication-and-laravel-wiring-not-implemented',
  knowledgeAnalysisMeaning: 'analyze-complete-semantic-knowledge-and-preserve-individual-judgment-traces',
  semanticScope: 'one-requested-invocation-and-its-relevant-semantic-dependencies',
  derivationMeaning: 'complete-invocation-domain-judgment-with-target-binding-effects-proof-and-obligations',
  evidenceOwnership: 'source-evidence-is-owned-upstream-and-is-never-invented-by-algebra-executor-or-scanner',
  judgmentAuthority: 'only-judgments-validated-against-the-invocation-semantic-contract-may-be-returned',
  closureMeaning: 'closed-only-when-applicable-domain-obligations-are-satisfied-and-proof-is-closed',
  partialMeaning: 'incomplete-judgments-preserve-proven-facts-and-all-unresolved-obligations',
  batchMeaning: 'one-independent-judgment-per-input-in-input-order-not-an-aggregate-knowledge-analysis',
  batchCorrespondence: 'one-output-entry-per-input-in-the-same-order-with-the-same-invocation-identity',
  batchIsolation: 'each-invocation-retains-its-own-evidence-judgment-and-proof',
  scannerRole: 'collect-source-derived-input-and-delegate-without-semantic-reasoning',
  traceRole: 'forward-authority-validated-proof-trace-without-reconstruction',
  downstreamRole: 'consume-validated-judgment-without-reconstructing-semantic-meaning',
});
