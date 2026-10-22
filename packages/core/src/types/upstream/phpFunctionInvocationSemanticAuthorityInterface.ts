import type {
  PhpFunctionNameResolutionInput,
  PhpFunctionNameResolutionJudgment,
} from './phpFunctionNameResolutionInterface';
import type { ExpressionArguments } from './expression';
import type { SourceFile } from './names';
import type { SourceSpan } from './provenance';

export type ResolvedPhpFunctionNameJudgment = Extract<
  PhpFunctionNameResolutionJudgment,
  { readonly kind: 'function_name_resolved' }
>;

export type UnresolvedPhpFunctionNameJudgment = Extract<
  PhpFunctionNameResolutionJudgment,
  { readonly kind: 'function_name_ambiguous' | 'function_name_unresolved' | 'function_name_deferred' }
>;

/**
 * Closed semantic judgment for a PHP function invocation. The resolved target remains
 * owned by the name-resolution judgment; this judgment does not duplicate it as a
 * separately constructible Expression that could disagree with the resolution.
 * Expression/AST construction belongs to the later projection boundary.
 */
export type PhpFunctionInvocationSemanticJudgment =
  | Readonly<{
      readonly kind: 'php_function_invocation_resolved';
      readonly resolution: ResolvedPhpFunctionNameJudgment;
      readonly arguments: ExpressionArguments;
    }>
  | Readonly<{
      readonly kind: 'php_function_invocation_unresolved';
      readonly resolution: UnresolvedPhpFunctionNameJudgment;
      readonly arguments: ExpressionArguments;
    }>;

/**
 * Invocation judgment contract: provenance has one owner. The judgment exposes its
 * source exclusively through the embedded name-resolution judgment; no copied span exists.
 */
export interface PhpFunctionInvocationSemanticContract {
  readonly kind: 'php_function_invocation_semantic_contract';
  readonly version: 2;
  readonly ruleOrder: readonly [
    'consume-completed-name-resolution-judgment',
    'derive-invocation-outcome-from-resolution-discriminant',
    'retain-source-provenance-only-through-resolution-judgment',
    'preserve-source-arguments-without-reinterpretation',
    'preserve-ambiguous-unresolved-and-deferred-resolution-outcomes',
    'never-repeat-name-resolution-or-construct-downstream-expression',
  ];
  readonly sourceOwnership: 'invocation-source-is-reachable-only-through-the-embedded-name-resolution-judgment-without-a-copied-span';
  readonly outcomeCorrespondence: 'resolved-name-resolution-produces-resolved-invocation-and-every-other-resolution-variant-produces-unresolved-invocation';
  readonly argumentOwnership: 'invocation-arguments-are-carried-forward-as-source-evidence-without-reinterpretation';
  readonly semanticBoundary: 'invocation-authority-does-not-perform-name-lookup-builtin-classification-or-expression-construction';
  readonly provenanceNormalization: 'resolution-judgment-is-the-single-source-of-truth-for-invocation-source-provenance';
}

export const PHP_FUNCTION_INVOCATION_SEMANTIC_CONTRACT: PhpFunctionInvocationSemanticContract = Object.freeze({
  kind: 'php_function_invocation_semantic_contract',
  version: 2,
  ruleOrder: Object.freeze([
    'consume-completed-name-resolution-judgment',
    'derive-invocation-outcome-from-resolution-discriminant',
    'retain-source-provenance-only-through-resolution-judgment',
    'preserve-source-arguments-without-reinterpretation',
    'preserve-ambiguous-unresolved-and-deferred-resolution-outcomes',
    'never-repeat-name-resolution-or-construct-downstream-expression',
  ]),
  sourceOwnership: 'invocation-source-is-reachable-only-through-the-embedded-name-resolution-judgment-without-a-copied-span',
  outcomeCorrespondence: 'resolved-name-resolution-produces-resolved-invocation-and-every-other-resolution-variant-produces-unresolved-invocation',
  argumentOwnership: 'invocation-arguments-are-carried-forward-as-source-evidence-without-reinterpretation',
  semanticBoundary: 'invocation-authority-does-not-perform-name-lookup-builtin-classification-or-expression-construction',
  provenanceNormalization: 'resolution-judgment-is-the-single-source-of-truth-for-invocation-source-provenance',
});

/**
 * Complete invocation evidence after the source frontend has supplied namespace,
 * imports, declarations, and name-syntax evidence to the name-resolution authority.
 * No duplicate source field is allowed: it could contradict resolution.source.source.
 */
export interface PhpFunctionInvocationSemanticInput {
  readonly kind: 'php_function_invocation_semantic_input';
  readonly resolution: PhpFunctionNameResolutionJudgment;
  readonly arguments: ExpressionArguments;
}

/**
 * Upstream authority boundary: consumes a completed name-resolution judgment and
 * publishes one closed invocation judgment under an explicit contract. It must not
 * perform name lookup itself or accept a competing source-span claim.
 */
export interface PhpFunctionInvocationSemanticAuthorityInterface {
  readonly kind: 'php_function_invocation_semantic_authority';
  readonly contract: PhpFunctionInvocationSemanticContract;
  readonly derive: (
    input: PhpFunctionInvocationSemanticInput,
  ) => PhpFunctionInvocationSemanticJudgment;
}

/** One source-level function-call fact before name resolution and judgment derivation. */
export interface PhpFunctionInvocationSourceEvidence {
  readonly kind: 'php_function_invocation_source_evidence';
  readonly resolutionInput: PhpFunctionNameResolutionInput;
  readonly arguments: ExpressionArguments;
}

/** Complete inventory witness: an empty inventory is valid only after every call node was visited. */
export interface PhpFunctionInvocationSourceInventoryCompletenessWitness {
  readonly kind: 'php_function_invocation_source_inventory_complete';
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly obligations: readonly [
    'all-php-function-call-nodes-inventoried',
    'all-call-arguments-captured',
    'all-name-resolution-environments-accounted-for',
  ];
}

export interface PhpFunctionInvocationSourceInventory {
  readonly kind: 'php_function_invocation_source_inventory';
  readonly sourceFile: SourceFile;
  readonly entries: readonly PhpFunctionInvocationSourceEvidence[];
  readonly completeness: PhpFunctionInvocationSourceInventoryCompletenessWitness;
}

/** One source-evidence/judgment pair. Neither side may be detached from its provenance. */
export interface PhpFunctionInvocationSemanticJudgmentBatchEntry {
  readonly kind: 'php_function_invocation_semantic_judgment_batch_entry';
  readonly evidence: PhpFunctionInvocationSourceEvidence;
  readonly judgment: PhpFunctionInvocationSemanticJudgment;
}

/** The contract prohibits partial judgment lists from masquerading as complete scanner output. */
export interface PhpFunctionInvocationSemanticJudgmentBatchContract {
  readonly kind: 'php_function_invocation_semantic_judgment_batch_contract';
  readonly version: 5;
  readonly closureRuleOrder: readonly [
    'require-inventory-and-completeness-witness-file-identity',
    'require-every-source-evidence-file-to-match-inventory-file',
    'require-every-invocation-and-callee-span-to-fit-certified-whole-file-span',
    'require-resolution-environment-file-to-match-inventory-file',
    'require-resolution-source-and-name-syntax-evidence-file-identity',
    'require-resolution-provenance-to-match-source-evidence-without-duplicated-judgment-span',
    'require-judgment-arguments-to-match-source-evidence',
    'require-unique-source-invocation-occurrence',
    'require-one-name-resolution-judgment-per-inventory-entry',
    'reject-name-resolution-judgments-outside-source-inventory',
    'require-total-inventory-to-judgment-correspondence',
    'reject-closure-when-any-obligation-fails',
  ];
  readonly inventoryClosure: 'batch-inventory-is-complete-for-one-source-file-including-an-explicitly-empty-inventory';
  readonly inventorySourceBinding: 'inventory-source-file-matches-every-entry-and-the-completeness-witness';
  readonly completenessWitnessBinding: 'inventory-completeness-witness-source-file-and-source-span-file-match-the-inventory-source-file';
  readonly evidenceSourceBinding: 'every-invocation-evidence-source-span-and-name-syntax-evidence-span-belongs-to-the-inventory-source-file';
  readonly wholeFileSpanBinding: 'every-invocation-source-span-and-callee-syntax-span-is-contained-by-the-certified-whole-file-span';
  readonly environmentSourceBinding: 'every-entry-resolution-environment-is-bound-to-the-inventory-source-file';
  readonly resolutionSourceBinding: 'resolution-input-source-and-name-syntax-evidence-span-belong-to-the-same-source-file';
  readonly judgmentResolutionBinding: 'judgment-resolution-matches-the-resolution-authority-result-for-the-entry-resolution-input';
  readonly totalCorrespondence: 'every-inventory-entry-has-exactly-one-judgment-and-every-judgment-belongs-to-one-inventory-entry';
  readonly sourceCorrelation: 'resolution-input-source-is-the-single-provenance-owner-for-evidence-and-invocation-judgment';
  readonly argumentCorrelation: 'judgment-arguments-are-the-exact-arguments-captured-by-the-corresponding-source-evidence';
  readonly uniqueness: 'one-source-invocation-evidence-occurrence-maps-to-one-and-only-one-batch-entry';
  readonly resolutionTotality: 'every-inventory-entry-matches-exactly-one-name-resolution-judgment-by-identical-resolution-input-identity';
  readonly resolutionInventoryOwnership: 'every-name-resolution-judgment-must-belong-to-exactly-one-source-inventory-entry';
  readonly batchDerivation: 'batch-authority-correlates-existing-resolution-judgments-derives-invocation-judgments-and-closes-the-total-inventory';
  readonly resolutionOwnership: 'batch-consumes-completed-name-resolution-judgments-and-never-repeats-name-resolution';
  readonly unresolvedPreservation: 'ambiguous-unresolved-and-deferred-resolution-outcomes-remain-explicit-judgments';
  readonly failureTruthfulness: 'a-batch-with-any-closure-violation-is-rejected-and-cannot-be-consumed-as-a-validated-batch';
}

export const PHP_FUNCTION_INVOCATION_SEMANTIC_JUDGMENT_BATCH_CONTRACT: PhpFunctionInvocationSemanticJudgmentBatchContract = Object.freeze({
  kind: 'php_function_invocation_semantic_judgment_batch_contract',
  version: 5,
  closureRuleOrder: Object.freeze([
    'require-inventory-and-completeness-witness-file-identity',
    'require-every-source-evidence-file-to-match-inventory-file',
    'require-every-invocation-and-callee-span-to-fit-certified-whole-file-span',
    'require-resolution-environment-file-to-match-inventory-file',
    'require-resolution-source-and-name-syntax-evidence-file-identity',
    'require-resolution-provenance-to-match-source-evidence-without-duplicated-judgment-span',
    'require-judgment-arguments-to-match-source-evidence',
    'require-unique-source-invocation-occurrence',
    'require-one-name-resolution-judgment-per-inventory-entry',
    'reject-name-resolution-judgments-outside-source-inventory',
    'require-total-inventory-to-judgment-correspondence',
    'reject-closure-when-any-obligation-fails',
  ]),
  inventoryClosure: 'batch-inventory-is-complete-for-one-source-file-including-an-explicitly-empty-inventory',
  inventorySourceBinding: 'inventory-source-file-matches-every-entry-and-the-completeness-witness',
  completenessWitnessBinding: 'inventory-completeness-witness-source-file-and-source-span-file-match-the-inventory-source-file',
  evidenceSourceBinding: 'every-invocation-evidence-source-span-and-name-syntax-evidence-span-belongs-to-the-inventory-source-file',
  wholeFileSpanBinding: 'every-invocation-source-span-and-callee-syntax-span-is-contained-by-the-certified-whole-file-span',
  environmentSourceBinding: 'every-entry-resolution-environment-is-bound-to-the-inventory-source-file',
  resolutionSourceBinding: 'resolution-input-source-and-name-syntax-evidence-span-belong-to-the-same-source-file',
  judgmentResolutionBinding: 'judgment-resolution-matches-the-resolution-authority-result-for-the-entry-resolution-input',
  totalCorrespondence: 'every-inventory-entry-has-exactly-one-judgment-and-every-judgment-belongs-to-one-inventory-entry',
  sourceCorrelation: 'resolution-input-source-is-the-single-provenance-owner-for-evidence-and-invocation-judgment',
  argumentCorrelation: 'judgment-arguments-are-the-exact-arguments-captured-by-the-corresponding-source-evidence',
  uniqueness: 'one-source-invocation-evidence-occurrence-maps-to-one-and-only-one-batch-entry',
  resolutionTotality: 'every-inventory-entry-matches-exactly-one-name-resolution-judgment-by-identical-resolution-input-identity',
  resolutionInventoryOwnership: 'every-name-resolution-judgment-must-belong-to-exactly-one-source-inventory-entry',
  batchDerivation: 'batch-authority-correlates-existing-resolution-judgments-derives-invocation-judgments-and-closes-the-total-inventory',
  resolutionOwnership: 'batch-consumes-completed-name-resolution-judgments-and-never-repeats-name-resolution',
  unresolvedPreservation: 'ambiguous-unresolved-and-deferred-resolution-outcomes-remain-explicit-judgments',
  failureTruthfulness: 'a-batch-with-any-closure-violation-is-rejected-and-cannot-be-consumed-as-a-validated-batch',
});

/** Typed reasons why source inventory and invocation judgments cannot form a closed batch. */
export type PhpFunctionInvocationSemanticJudgmentBatchViolation =
  | Readonly<{ readonly kind: 'inventory-file-mismatch'; readonly inventory: PhpFunctionInvocationSourceInventory['sourceFile']; readonly evidence: PhpFunctionInvocationSourceEvidence }>
  | Readonly<{ readonly kind: 'invocation-outside-certified-source-span'; readonly evidence: PhpFunctionInvocationSourceEvidence; readonly certifiedSource: SourceSpan }>
  | Readonly<{ readonly kind: 'inventory-completeness-file-mismatch'; readonly inventory: PhpFunctionInvocationSourceInventory['sourceFile']; readonly witness: PhpFunctionInvocationSourceInventoryCompletenessWitness }>
  | Readonly<{ readonly kind: 'incomplete-inventory-witness'; readonly witness: PhpFunctionInvocationSourceInventoryCompletenessWitness }>
  | Readonly<{ readonly kind: 'resolution-environment-file-mismatch'; readonly inventory: PhpFunctionInvocationSourceInventory['sourceFile']; readonly evidence: PhpFunctionInvocationSourceEvidence }>
  | Readonly<{ readonly kind: 'resolution-source-file-mismatch'; readonly evidence: PhpFunctionInvocationSourceEvidence }>
  | Readonly<{ readonly kind: 'name-syntax-source-file-mismatch'; readonly evidence: PhpFunctionInvocationSourceEvidence }>
  | Readonly<{ readonly kind: 'missing-invocation-judgment'; readonly evidence: PhpFunctionInvocationSourceEvidence }>
  | Readonly<{ readonly kind: 'orphan-invocation-judgment'; readonly entry: PhpFunctionInvocationSemanticJudgmentBatchEntry }>
  | Readonly<{ readonly kind: 'duplicate-invocation-evidence'; readonly evidence: PhpFunctionInvocationSourceEvidence }>
  | Readonly<{ readonly kind: 'judgment-resolution-mismatch'; readonly entry: PhpFunctionInvocationSemanticJudgmentBatchEntry }>
  | Readonly<{ readonly kind: 'judgment-arguments-mismatch'; readonly entry: PhpFunctionInvocationSemanticJudgmentBatchEntry }>
  | Readonly<{ readonly kind: 'name-resolution-judgment-outside-inventory'; readonly resolution: PhpFunctionNameResolutionJudgment }>;

/** A receipt can only be issued after an authority has checked every closure obligation. */
export interface PhpFunctionInvocationSemanticJudgmentBatchClosureReceipt {
  readonly kind: 'php_function_invocation_semantic_judgment_batch_closure_receipt';
  readonly contract: PhpFunctionInvocationSemanticJudgmentBatchContract;
  readonly inventory: PhpFunctionInvocationSourceInventory;
  readonly entries: readonly PhpFunctionInvocationSemanticJudgmentBatchEntry[];
  readonly correspondences: readonly Readonly<{
    readonly kind: 'php_function_invocation_source_judgment_correspondence';
    readonly evidence: PhpFunctionInvocationSourceEvidence;
    readonly judgment: PhpFunctionInvocationSemanticJudgment;
  }>[];
  readonly invariant: 'inventory-and-judgments-form-a-total-bijection-with-identical-source-and-argument-evidence';
}

/** Rejected closure retains its evidence and non-empty typed violation ledger. */
export type PhpFunctionInvocationSemanticJudgmentBatchClosureResult =
  | Readonly<{
      readonly kind: 'php_function_invocation_semantic_judgment_batch_validated';
      readonly receipt: PhpFunctionInvocationSemanticJudgmentBatchClosureReceipt;
    }>
  | Readonly<{
      readonly kind: 'php_function_invocation_semantic_judgment_batch_rejected';
      readonly inventory: PhpFunctionInvocationSourceInventory;
      readonly entries: readonly PhpFunctionInvocationSemanticJudgmentBatchEntry[];
      readonly violations: readonly [PhpFunctionInvocationSemanticJudgmentBatchViolation, ...PhpFunctionInvocationSemanticJudgmentBatchViolation[]];
    }>;

/** Existing invocation authority now owns judgment derivation; closure remains a typed, explicit outcome. */
export interface PhpFunctionInvocationSemanticJudgmentBatchDerivationInput {
  readonly kind: 'php_function_invocation_semantic_judgment_batch_derivation_input';
  readonly inventory: PhpFunctionInvocationSourceInventory;
  readonly resolutions: readonly PhpFunctionNameResolutionJudgment[];
}

export interface PhpFunctionInvocationSemanticJudgmentBatchClosureAuthorityInterface {
  readonly kind: 'php_function_invocation_semantic_judgment_batch_closure_authority';
  readonly contract: PhpFunctionInvocationSemanticJudgmentBatchContract;
  /** Low-level closure for already-derived entries. */
  readonly close: (input: Readonly<{
    readonly kind: 'php_function_invocation_semantic_judgment_batch_closure_input';
    readonly inventory: PhpFunctionInvocationSourceInventory;
    readonly entries: readonly PhpFunctionInvocationSemanticJudgmentBatchEntry[];
  }>) => PhpFunctionInvocationSemanticJudgmentBatchClosureResult;
  /** Batch path: correlate each source occurrence to its existing resolution judgment, derive invocation judgments, then close the complete batch. */
  readonly derive: (
    input: PhpFunctionInvocationSemanticJudgmentBatchDerivationInput,
  ) => PhpFunctionInvocationSemanticJudgmentBatchClosureResult;
}

/** Only an authority-issued receipt represents a validated batch; raw entries are not closure proof. */
export type PhpFunctionInvocationSemanticJudgmentBatch = Extract<
  PhpFunctionInvocationSemanticJudgmentBatchClosureResult,
  { readonly kind: 'php_function_invocation_semantic_judgment_batch_validated' }
>['receipt'];

/** Explicit migration state when the scanner cannot yet supply a source-complete batch. */
export interface PhpFunctionInvocationSemanticIntegrationPending {
  readonly kind: 'php_function_invocation_semantic_integration_pending';
  readonly blockers: readonly [
    'source-function-call-inventory-not-connected-to-controller-composition',
    'php-namespace-import-environment-not-inventoried-by-scanner',
    'declared-function-environment-not-inventoried-by-scanner',
    'whole-file-namespace-region-inventory-not-available-to-method-body-scanner',
    'namespace-prefix-import-and-function-import-declarations-not-inventoried-per-region',
    'source-wide-namespace-inventory-authority-not-connected-to-name-resolution',
    'namespace-inventory-to-resolution-environment-projection-not-connected',
    'resolution-environment-projection-not-connected-to-name-resolution-input',
    'resolution-environment-projection-not-connected-to-invocation-judgment-batch',
    'namespace-region-inventory-not-bound-to-invocation-batch',
  ];
}

export type PhpFunctionInvocationSemanticIntegrationState =
  | PhpFunctionInvocationSemanticJudgmentBatchClosureResult
  | PhpFunctionInvocationSemanticIntegrationPending;

const phpFunctionInvocationSemanticIntegrationPendingBlockers: PhpFunctionInvocationSemanticIntegrationPending['blockers'] = Object.freeze([
  'source-function-call-inventory-not-connected-to-controller-composition',
  'php-namespace-import-environment-not-inventoried-by-scanner',
  'declared-function-environment-not-inventoried-by-scanner',
  'whole-file-namespace-region-inventory-not-available-to-method-body-scanner',
  'namespace-prefix-import-and-function-import-declarations-not-inventoried-per-region',
  'source-wide-namespace-inventory-authority-not-connected-to-name-resolution',
  'namespace-inventory-to-resolution-environment-projection-not-connected',
  'resolution-environment-projection-not-connected-to-name-resolution-input',
  'resolution-environment-projection-not-connected-to-invocation-judgment-batch',
  'namespace-region-inventory-not-bound-to-invocation-batch',
]);

export const PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING: PhpFunctionInvocationSemanticIntegrationPending = Object.freeze({
  kind: 'php_function_invocation_semantic_integration_pending',
  blockers: phpFunctionInvocationSemanticIntegrationPendingBlockers,
});
