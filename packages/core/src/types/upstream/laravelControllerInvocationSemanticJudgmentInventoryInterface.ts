import type { SourceFile } from './names';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import { LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT, type LaravelSourceIdentitySemanticsContract, type LaravelSourceIdentitySemanticsInterface } from './sourceProjectIdentity';

/** Discovery evidence is explicitly bound to the project whose controller sources were enumerated. */
export interface LaravelControllerSourceInventoryCompletenessWitness {
  readonly kind: 'laravel_controller_source_inventory_completeness_witness';
  readonly sourceProject: SourceProjectIdentity;
  readonly obligations: readonly [
    'source-project-identity-matches-the-inventory-project',
    'all-controller-source-files-discovered-for-the-source-project',
    'empty-controller-source-set-is-explicitly-certified-when-applicable',
    'each-source-file-identity-is-canonical-and-unique',
  ];
}

export interface LaravelControllerSourceInventoryInterface {
  readonly kind: 'laravel_controller_source_inventory';
  readonly contractVersion: 1;
  readonly sourceProject: SourceProjectIdentity;
  readonly sources: readonly SourceFile[];
  readonly completeness: LaravelControllerSourceInventoryCompletenessWitness;
}

/** Filesystem discovery must close before its output can be asserted as a complete source inventory. */
export type LaravelControllerSourceDiscoveryBlocker =
  | Readonly<{ readonly kind: 'controller_source_discovery_root_missing'; readonly root: SourceFile }>
  | Readonly<{ readonly kind: 'controller_source_discovery_directory_missing'; readonly directory: SourceFile }>
  | Readonly<{ readonly kind: 'controller_source_discovery_path_not_directory'; readonly directory: SourceFile }>
  | Readonly<{ readonly kind: 'controller_source_discovery_directory_unreadable'; readonly directory: SourceFile }>
  | Readonly<{ readonly kind: 'controller_source_discovery_symbolic_link_encountered'; readonly sourceFile: SourceFile }>;

/** Closed discovery ADT preserves partial evidence instead of treating failed enumeration as an empty project. */
export type LaravelControllerSourceDiscoveryResult =
  | Readonly<{
      readonly kind: 'laravel_controller_source_discovery_complete';
      readonly contractVersion: 2;
      readonly sourceProject: SourceProjectIdentity;
      readonly root: SourceFile;
      readonly sources: readonly SourceFile[];
    }>
  | Readonly<{
      readonly kind: 'laravel_controller_source_discovery_blocked';
      readonly contractVersion: 2;
      readonly sourceProject: SourceProjectIdentity;
      readonly root: SourceFile;
      readonly partialSources: readonly SourceFile[];
      readonly blocker: LaravelControllerSourceDiscoveryBlocker;
    }>;

export interface LaravelControllerSourceDiscoveryInput {
  readonly kind: 'laravel_controller_source_discovery_input';
  readonly sourceProject: SourceProjectIdentity;
  readonly root: SourceFile;
}

/** Contract for deterministic, project-bound discovery; it does not interpret invocation semantics. */
export interface LaravelControllerSourceDiscoveryInterface {
  readonly kind: 'laravel_controller_source_discovery';
  readonly closed: true;
  readonly contractVersion: 2;
  readonly symbolicLinkPolicy: 'block-complete-discovery-when-an-unresolved-symbolic-link-is-encountered';
  readonly discover: (input: LaravelControllerSourceDiscoveryInput) => Promise<LaravelControllerSourceDiscoveryResult>;
}

export type LaravelControllerInvocationSemanticJudgmentInventoryRejection =
  | Readonly<{
      readonly kind: 'controller_source_inventory_project_binding_mismatch';
      readonly inventoryProject: SourceProjectIdentity;
      readonly witnessProject: SourceProjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'controller_source_inventory_completeness_witness_invalid';
      readonly witness: LaravelControllerSourceInventoryCompletenessWitness;
    }>
  | Readonly<{
      readonly kind: 'controller_source_inventory_contains_duplicate_source';
      readonly sourceFile: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'controller_source_has_no_invocation_judgment';
      readonly sourceFile: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'controller_source_has_multiple_invocation_judgments';
      readonly sourceFile: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'invocation_judgment_is_outside_controller_source_inventory';
      readonly sourceFile: SourceFile;
    }>;

/** Evidence to close a total one-to-one relation between discovered controller files and judgments. */
export interface LaravelControllerInvocationSemanticJudgmentInventoryInput {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_input';
  readonly sourceInventory: LaravelControllerSourceInventoryInterface;
  readonly judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];
}

export interface LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_complete';
  readonly obligations: readonly [
    'controller-source-inventory-is-complete-and-project-bound',
    'every-controller-source-has-exactly-one-invocation-judgment',
    'no-judgment-exists-outside-the-controller-source-inventory',
    'not-connected-is-preserved-as-an-explicit-integrated-outcome',
    'source-identity-and-integrated-response-remain-one-correlated-judgment',
  ];
}

/** Authority-produced receipt; source identity remains canonical on each judgment. */
export interface LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_closure_receipt';
  readonly contract: LaravelControllerInvocationSemanticJudgmentInventoryContract;
  readonly sourceInventory: LaravelControllerSourceInventoryInterface;
  readonly correspondences: readonly LaravelControllerInvocationSemanticJudgmentInterface[];
  readonly completeness: LaravelControllerInvocationSemanticJudgmentInventoryCompletenessWitness;
  readonly outcomePreservation: LaravelControllerInvocationSemanticJudgmentInventoryOutcomePreservationRule;
}

/** Only the receipt-bearing validated variant may cross the Laravel controller scanner boundary. */
export type LaravelControllerInvocationSemanticJudgmentInventoryResult =
  | Readonly<{
      readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated';
      readonly contractVersion: 11;
      readonly receipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
    }>
  | Readonly<{
      readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected';
      readonly contractVersion: 11;
      readonly sourceInventory: LaravelControllerSourceInventoryInterface;
      readonly rejections: readonly [
        LaravelControllerInvocationSemanticJudgmentInventoryRejection,
        ...LaravelControllerInvocationSemanticJudgmentInventoryRejection[],
      ];
    }>;

export interface LaravelControllerInvocationSemanticJudgmentInventoryProjectBindingRule {
  readonly kind: 'project_binding_rule';
  readonly sameIdentityRelation: 'same_source_project_identity';
  readonly differentIdentityRelation: 'different_source_project_identity';
  readonly rejectionKind: 'controller_source_inventory_project_binding_mismatch';
}

export interface LaravelControllerInvocationSemanticJudgmentInventoryCompletenessRule {
  readonly kind: 'completeness_witness_rule';
  readonly witnessKind: 'laravel_controller_source_inventory_completeness_witness';
  readonly requiredObligations: readonly [
    'source-project-identity-matches-the-inventory-project',
    'all-controller-source-files-discovered-for-the-source-project',
    'empty-controller-source-set-is-explicitly-certified-when-applicable',
    'each-source-file-identity-is-canonical-and-unique',
  ];
  readonly rejectionKind: 'controller_source_inventory_completeness_witness_invalid';
}

export interface LaravelControllerInvocationSemanticJudgmentInventorySourceIdentityRule {
  readonly kind: 'source_identity_uniqueness_rule';
  readonly sameIdentityRelation: 'same_source_file_identity';
  readonly maximumOccurrences: 1;
  readonly rejectionKind: 'controller_source_inventory_contains_duplicate_source';
}

export interface LaravelControllerInvocationSemanticJudgmentInventoryCorrespondenceRule {
  readonly kind: 'judgment_correspondence_rule';
  readonly minimumMatches: 1;
  readonly maximumMatches: 1;
  readonly sameIdentityRelation: 'same_source_file_identity';
  readonly missingJudgmentRejectionKind: 'controller_source_has_no_invocation_judgment';
  readonly multipleJudgmentsRejectionKind: 'controller_source_has_multiple_invocation_judgments';
  readonly orphanJudgmentRejectionKind: 'invocation_judgment_is_outside_controller_source_inventory';
}

export interface LaravelControllerInvocationSemanticJudgmentInventoryOutcomePreservationRule {
  readonly kind: 'integrated_outcome_preservation_rule';
  readonly outcomes: readonly [
    'php_source_invocation_integration_complete',
    'php_source_invocation_integration_blocked',
    'php_source_invocation_integration_source_binding_rejected',
    'php_source_invocation_integration_not_connected',
  ];
  readonly preserveSourceIdentityAndIntegratedResponseAsOneJudgment: true;
}

export interface LaravelControllerInvocationSemanticJudgmentInventoryRejectionAggregationRule {
  readonly kind: 'rejection_aggregation_rule';
  readonly mode: 'preserve_all_independent_violations';
  readonly resultKind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected';
  readonly ledgerCardinality: 'non_empty';
}

/**
 * Executable declarative reasoning ADT owned by the inventory interface.
 * The authority interprets these typed rules; rule values are not prose-only labels.
 */
export interface LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_reasoning_contract';
  readonly version: 3;
  readonly rules: Readonly<{
    readonly projectBinding: LaravelControllerInvocationSemanticJudgmentInventoryProjectBindingRule;
    readonly completenessWitness: LaravelControllerInvocationSemanticJudgmentInventoryCompletenessRule;
    readonly sourceIdentityUniqueness: LaravelControllerInvocationSemanticJudgmentInventorySourceIdentityRule;
    readonly judgmentCorrespondence: LaravelControllerInvocationSemanticJudgmentInventoryCorrespondenceRule;
    readonly outcomePreservation: LaravelControllerInvocationSemanticJudgmentInventoryOutcomePreservationRule;
    readonly rejectionAggregation: LaravelControllerInvocationSemanticJudgmentInventoryRejectionAggregationRule;
  }>;
}


/** Closed semantic judgment for project identity binding. */
export type LaravelControllerInvocationInventoryProjectBindingJudgment =
  | Readonly<{
      readonly kind: 'project_binding_accepted';
      readonly relation: Extract<ReturnType<LaravelSourceIdentitySemanticsInterface['relateSourceProjects']>, { readonly kind: 'same_source_project_identity' }>;
      readonly rejections: readonly never[];
    }>
  | Readonly<{
      readonly kind: 'project_binding_rejected';
      readonly relation: Extract<ReturnType<LaravelSourceIdentitySemanticsInterface['relateSourceProjects']>, { readonly kind: 'different_source_project_identity' }>;
      readonly rejections: readonly [Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_project_binding_mismatch' }>, ...Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_project_binding_mismatch' }>[]];
    }>;

/** Closed semantic judgment for the completeness witness. */
export type LaravelControllerInvocationInventoryCompletenessJudgment =
  | Readonly<{
      readonly kind: 'completeness_witness_accepted';
      readonly witness: LaravelControllerSourceInventoryCompletenessWitness;
      readonly rejections: readonly never[];
    }>
  | Readonly<{
      readonly kind: 'completeness_witness_rejected';
      readonly witness: LaravelControllerSourceInventoryCompletenessWitness;
      readonly rejections: readonly [Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_completeness_witness_invalid' }>, ...Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_completeness_witness_invalid' }>[]];
    }>;

/** Closed semantic judgment for canonical source identity uniqueness. */
export type LaravelControllerInvocationInventorySourceIdentityJudgment =
  | Readonly<{
      readonly kind: 'source_identity_unique';
      readonly sources: readonly SourceFile[];
      readonly rejections: readonly never[];
    }>
  | Readonly<{
      readonly kind: 'source_identity_duplicates_found';
      readonly duplicates: readonly SourceFile[];
      readonly rejections: readonly [
        Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_contains_duplicate_source' }>,
        ...Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_contains_duplicate_source' }>[],
      ];
    }>;

/** Closed semantic judgment for the total one-to-one source/judgment correspondence. */
export type LaravelControllerInvocationInventoryCorrespondenceJudgment =
  | Readonly<{
      readonly kind: 'judgment_correspondence_closed';
      readonly sourceInventory: LaravelControllerSourceInventoryInterface;
      readonly judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];
      readonly rejections: readonly never[];
    }>
  | Readonly<{
      readonly kind: 'judgment_correspondence_rejected';
      readonly missingSources: readonly SourceFile[];
      readonly multiplyJudgedSources: readonly SourceFile[];
      readonly orphanJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];
      readonly rejections: readonly [
        LaravelControllerInvocationSemanticJudgmentInventoryRejection,
        ...LaravelControllerInvocationSemanticJudgmentInventoryRejection[],
      ];
    }>;

/**
 * Reasoning interface: each operation publishes a typed semantic judgment.
 * The inventory authority composes these judgments; it does not repeat their predicates.
 */
export interface LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_reasoning';
  readonly contract: LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract;
  readonly judgeProjectBinding: (
    inventoryProject: SourceProjectIdentity,
    witnessProject: SourceProjectIdentity,
  ) => LaravelControllerInvocationInventoryProjectBindingJudgment;
  readonly judgeCompletenessWitness: (
    witness: LaravelControllerSourceInventoryCompletenessWitness,
  ) => LaravelControllerInvocationInventoryCompletenessJudgment;
  readonly judgeSourceIdentityUniqueness: (
    sources: readonly SourceFile[],
  ) => LaravelControllerInvocationInventorySourceIdentityJudgment;
  readonly judgeJudgmentCorrespondence: (
    sourceInventory: LaravelControllerSourceInventoryInterface,
    judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[],
  ) => LaravelControllerInvocationInventoryCorrespondenceJudgment;
}

export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT: LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_inventory_reasoning_contract',
  version: 3,
  rules: Object.freeze({
    projectBinding: Object.freeze({
      kind: 'project_binding_rule',
      sameIdentityRelation: 'same_source_project_identity',
      differentIdentityRelation: 'different_source_project_identity',
      rejectionKind: 'controller_source_inventory_project_binding_mismatch',
    }),
    completenessWitness: Object.freeze({
      kind: 'completeness_witness_rule',
      witnessKind: 'laravel_controller_source_inventory_completeness_witness',
      requiredObligations: Object.freeze([
        'source-project-identity-matches-the-inventory-project',
        'all-controller-source-files-discovered-for-the-source-project',
        'empty-controller-source-set-is-explicitly-certified-when-applicable',
        'each-source-file-identity-is-canonical-and-unique',
      ] as const),
      rejectionKind: 'controller_source_inventory_completeness_witness_invalid',
    }),
    sourceIdentityUniqueness: Object.freeze({
      kind: 'source_identity_uniqueness_rule',
      sameIdentityRelation: 'same_source_file_identity',
      maximumOccurrences: 1,
      rejectionKind: 'controller_source_inventory_contains_duplicate_source',
    }),
    judgmentCorrespondence: Object.freeze({
      kind: 'judgment_correspondence_rule',
      minimumMatches: 1,
      maximumMatches: 1,
      sameIdentityRelation: 'same_source_file_identity',
      missingJudgmentRejectionKind: 'controller_source_has_no_invocation_judgment',
      multipleJudgmentsRejectionKind: 'controller_source_has_multiple_invocation_judgments',
      orphanJudgmentRejectionKind: 'invocation_judgment_is_outside_controller_source_inventory',
    }),
    outcomePreservation: Object.freeze({
      kind: 'integrated_outcome_preservation_rule',
      outcomes: Object.freeze([
        'php_source_invocation_integration_complete',
        'php_source_invocation_integration_blocked',
        'php_source_invocation_integration_source_binding_rejected',
        'php_source_invocation_integration_not_connected',
      ] as const),
      preserveSourceIdentityAndIntegratedResponseAsOneJudgment: true,
    }),
    rejectionAggregation: Object.freeze({
      kind: 'rejection_aggregation_rule',
      mode: 'preserve_all_independent_violations',
      resultKind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected',
      ledgerCardinality: 'non_empty',
    }),
  }),
});

export interface LaravelControllerInvocationSemanticJudgmentInventoryContract {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_contract';
  readonly version: 11;
  readonly reasoning: LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract;
  readonly closureOrder: readonly [
    'bind-completeness-witness-to-the-same-source-project-identity',
    'validate-source-inventory-completeness-and-project-binding',
    'validate-canonical-source-identity-uniqueness',
    'validate-exactly-one-judgment-per-controller-source',
    'reject-judgments-outside-the-controller-source-inventory',
    'publish-only-a-receipt-bearing-validated-result',
  ];
  readonly receiptRule: 'validated-result-carries-one-authority-bound-receipt-with-source-inventory-and-corresponding-judgments';
  readonly dependencyBoundaryRule: 'inventory-authority-must-not-import-semantic-foundation-or-semantic-relations-and-must-use-the-canonical-upstream-typed-identity-relation-judgment-interface';
  readonly identitySemanticsContract: LaravelSourceIdentitySemanticsContract;
}

export interface LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_authority';
  readonly contract: LaravelControllerInvocationSemanticJudgmentInventoryContract;
  readonly identitySemantics: LaravelSourceIdentitySemanticsInterface;
  readonly reasoning: LaravelControllerInvocationSemanticJudgmentInventoryReasoningInterface;
  readonly close: (
    input: LaravelControllerInvocationSemanticJudgmentInventoryInput,
  ) => LaravelControllerInvocationSemanticJudgmentInventoryResult;
}

export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT: LaravelControllerInvocationSemanticJudgmentInventoryContract = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_inventory_contract',
  version: 11,
  reasoning: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_REASONING_CONTRACT,
  identitySemanticsContract: LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT,
  closureOrder: Object.freeze([
    'bind-completeness-witness-to-the-same-source-project-identity',
    'validate-source-inventory-completeness-and-project-binding',
    'validate-canonical-source-identity-uniqueness',
    'validate-exactly-one-judgment-per-controller-source',
    'reject-judgments-outside-the-controller-source-inventory',
    'publish-only-a-receipt-bearing-validated-result',
  ] as const),
  receiptRule: 'validated-result-carries-one-authority-bound-receipt-with-source-inventory-and-corresponding-judgments',
  authorityImplementationRule: 'authority-executes-this-closed-contract-through-canonical-upstream-typed-identity-relation-judgments-without-semantic-foundation-or-semantic-relations-dependencies-and-scanner-never-revalidates-or-repairs-the-receipt',
  dependencyBoundaryRule: 'inventory-authority-must-not-import-semantic-foundation-or-semantic-relations-and-must-use-the-canonical-upstream-typed-identity-relation-judgment-interface',
  sourceInventoryRule: 'only-a-source-project-bound-complete-controller-inventory-may-be-closed-including-an-explicitly-empty-inventory',
  totalCorrespondenceRule: 'each-controller-source-has-exactly-one-judgment-and-each-judgment-belongs-to-one-controller-source',
  sourceIdentityRule: 'judgment-source-file-is-the-canonical-source-identity-and-is-not-copied-into-a-parallel-entry-field',
  outcomeRule: 'complete-blocked-source-binding-rejected-and-not-connected-remain-distinct',
  rejectionRule: 'any-invalid-project-witness-missing-duplicate-or-out-of-inventory-judgment-rejects-the-whole-inventory-with-a-non-empty-typed-ledger',
});
