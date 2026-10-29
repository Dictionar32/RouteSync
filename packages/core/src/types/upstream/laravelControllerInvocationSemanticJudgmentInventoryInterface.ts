import type { SourceFile, SourceFileInventory } from './names';
import type { LaravelRouteSourceSelectionIntent } from './laravelRouteSourceSelection';
import type { ManifestBuilderInterface, ManifestBuilderJudgment, ManifestBuilderOperationPreparationInterface } from './manifestBuilderInterface';
import type { FilesystemFailureCode, FilesystemFailureLocation } from './filesystemFailureInterface';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { SourceFileIdentityRelationJudgment } from './sourceProjectIdentity';
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
  readonly contractVersion: 2;
  readonly sourceProject: SourceProjectIdentity;
  readonly sources: SourceFileInventory;
  readonly completeness: LaravelControllerSourceInventoryCompletenessWitness;
}

/** Input for the blocker-owned transition back into the discovery domain. */
export interface LaravelControllerSourceDiscoveryBlockerSettlementInput {
  readonly sourceProject: SourceProjectIdentity;
  readonly root: SourceFile;
  readonly partialSources: SourceFileInventory;
}

/** Filesystem discovery blockers retain evidence and own the domain transition to a blocked judgment. */
export interface LaravelControllerSourceDiscoveryBlockerOperations {
  readonly blockDiscovery: (
    input: LaravelControllerSourceDiscoveryBlockerSettlementInput,
  ) => LaravelControllerSourceDiscoveryResult;
}

export type LaravelControllerSourceDiscoveryBlockerEvidence =
  | Readonly<{ readonly kind: 'controller_source_discovery_root_missing'; readonly root: SourceFile; readonly failure: unknown }>
  | Readonly<{ readonly kind: 'controller_source_discovery_directory_missing'; readonly directory: SourceFile; readonly failure: unknown }>
  | Readonly<{ readonly kind: 'controller_source_discovery_path_not_directory'; readonly directory: SourceFile; readonly failure: unknown }>
  | Readonly<{ readonly kind: 'controller_source_discovery_directory_unreadable'; readonly directory: SourceFile; readonly failure: unknown }>
  | Readonly<{ readonly kind: 'controller_source_discovery_symbolic_link_encountered'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'controller_source_discovery_failure_code_unrecognized'; readonly directory: SourceFile; readonly failure: unknown }>;

export type LaravelControllerSourceDiscoveryBlocker =
  | (Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_root_missing' }> & LaravelControllerSourceDiscoveryBlockerOperations)
  | (Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_directory_missing' }> & LaravelControllerSourceDiscoveryBlockerOperations)
  | (Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_path_not_directory' }> & LaravelControllerSourceDiscoveryBlockerOperations)
  | (Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_directory_unreadable' }> & LaravelControllerSourceDiscoveryBlockerOperations)
  | (Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_symbolic_link_encountered' }> & LaravelControllerSourceDiscoveryBlockerOperations)
  | (Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_failure_code_unrecognized' }> & LaravelControllerSourceDiscoveryBlockerOperations);

export interface LaravelControllerSourceDiscoveryBlockerFactoryInterface {
  readonly rootMissing: (root: SourceFile, failure: unknown) => Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_root_missing' }>;
  readonly directoryMissing: (directory: SourceFile, failure: unknown) => Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_directory_missing' }>;
  readonly pathNotDirectory: (directory: SourceFile, failure: unknown) => Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_path_not_directory' }>;
  readonly directoryUnreadable: (directory: SourceFile, failure: unknown) => Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_directory_unreadable' }>;
  readonly symbolicLinkEncountered: (sourceFile: SourceFile) => Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_symbolic_link_encountered' }>;
  readonly failureCodeUnrecognized: (directory: SourceFile, failure: unknown) => Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_failure_code_unrecognized' }>;
}

/** Existing discovery authority owns blocker variants and their typed follow-up operation. */
export const laravelControllerSourceDiscoveryBlockerFactory: LaravelControllerSourceDiscoveryBlockerFactoryInterface = Object.freeze({
  rootMissing: (root, failure) => {
    const evidence: Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_root_missing' }> = Object.freeze({ kind: 'controller_source_discovery_root_missing', root, failure });
    const blocker: Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_root_missing' }> = Object.freeze({ ...evidence, blockDiscovery: input => laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({ kind: 'laravel_controller_source_discovery_blocked', contractVersion: 4, sourceProject: input.sourceProject, root: input.root, partialSources: input.partialSources, blocker })) });
    return blocker;
  },
  directoryMissing: (directory, failure) => {
    const evidence: Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_directory_missing' }> = Object.freeze({ kind: 'controller_source_discovery_directory_missing', directory, failure });
    const blocker: Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_directory_missing' }> = Object.freeze({ ...evidence, blockDiscovery: input => laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({ kind: 'laravel_controller_source_discovery_blocked', contractVersion: 4, sourceProject: input.sourceProject, root: input.root, partialSources: input.partialSources, blocker })) });
    return blocker;
  },
  pathNotDirectory: (directory, failure) => {
    const evidence: Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_path_not_directory' }> = Object.freeze({ kind: 'controller_source_discovery_path_not_directory', directory, failure });
    const blocker: Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_path_not_directory' }> = Object.freeze({ ...evidence, blockDiscovery: input => laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({ kind: 'laravel_controller_source_discovery_blocked', contractVersion: 4, sourceProject: input.sourceProject, root: input.root, partialSources: input.partialSources, blocker })) });
    return blocker;
  },
  directoryUnreadable: (directory, failure) => {
    const evidence: Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_directory_unreadable' }> = Object.freeze({ kind: 'controller_source_discovery_directory_unreadable', directory, failure });
    const blocker: Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_directory_unreadable' }> = Object.freeze({ ...evidence, blockDiscovery: input => laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({ kind: 'laravel_controller_source_discovery_blocked', contractVersion: 4, sourceProject: input.sourceProject, root: input.root, partialSources: input.partialSources, blocker })) });
    return blocker;
  },
  symbolicLinkEncountered: sourceFile => {
    const evidence: Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_symbolic_link_encountered' }> = Object.freeze({ kind: 'controller_source_discovery_symbolic_link_encountered', sourceFile });
    const blocker: Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_symbolic_link_encountered' }> = Object.freeze({ ...evidence, blockDiscovery: input => laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({ kind: 'laravel_controller_source_discovery_blocked', contractVersion: 4, sourceProject: input.sourceProject, root: input.root, partialSources: input.partialSources, blocker })) });
    return blocker;
  },
  failureCodeUnrecognized: (directory, failure) => {
    const evidence: Extract<LaravelControllerSourceDiscoveryBlockerEvidence, { readonly kind: 'controller_source_discovery_failure_code_unrecognized' }> = Object.freeze({ kind: 'controller_source_discovery_failure_code_unrecognized', directory, failure });
    const blocker: Extract<LaravelControllerSourceDiscoveryBlocker, { readonly kind: 'controller_source_discovery_failure_code_unrecognized' }> = Object.freeze({ ...evidence, blockDiscovery: input => laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({ kind: 'laravel_controller_source_discovery_blocked', contractVersion: 4, sourceProject: input.sourceProject, root: input.root, partialSources: input.partialSources, blocker })) });
    return blocker;
  },
});

/** Fixed, core-owned projection consumed by the CLI manifest composition boundary. */
export type LaravelControllerSourceDiscoveryManifestProjection =
  | Readonly<{
      readonly kind: 'laravel_controller_source_discovery_manifest_complete';
      readonly sourceProject: SourceProjectIdentity;
      readonly root: SourceFile;
      readonly sources: SourceFileInventory;
      readonly preserveCompleteJudgment: () => Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_complete' }>;
    }>
  | Readonly<{
      readonly kind: 'laravel_controller_source_discovery_manifest_blocked';
      readonly sourceProject: SourceProjectIdentity;
      readonly root: SourceFile;
      readonly partialSources: SourceFileInventory;
      readonly blocker: LaravelControllerSourceDiscoveryBlocker;
      readonly preserveBlockedJudgment: () => Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_blocked' }>;
    }>;

/** Raw discovery evidence used only while the filesystem traversal is being constructed. */
export type LaravelControllerSourceDiscoveryEvidence =
  | Readonly<{
      readonly kind: 'laravel_controller_source_discovery_complete';
      readonly contractVersion: 4;
      readonly sourceProject: SourceProjectIdentity;
      readonly root: SourceFile;
      readonly sources: SourceFileInventory;
    }>
  | Readonly<{
      readonly kind: 'laravel_controller_source_discovery_blocked';
      readonly contractVersion: 4;
      readonly sourceProject: SourceProjectIdentity;
      readonly root: SourceFile;
      readonly partialSources: SourceFileInventory;
      readonly blocker: LaravelControllerSourceDiscoveryBlocker;
    }>;

/** Discovery outcomes own continuation so callers need not reinterpret the result discriminator. */
export interface LaravelControllerSourceDiscoveryJudgmentOperations {
  /** Projects discovery into a fixed upstream contract for CLI manifest composition without generic visitor handlers. */
  readonly projectForManifest: () => LaravelControllerSourceDiscoveryManifestProjection;
  /** Continue only a complete discovery; a blocked discovery preserves its original terminal evidence. */
  readonly continueCompleteDiscovery: (
    continuation: (judgment: Extract<LaravelControllerSourceDiscoveryEvidence, { readonly kind: 'laravel_controller_source_discovery_complete' }>) => Promise<LaravelControllerSourceDiscoveryResult>,
  ) => Promise<LaravelControllerSourceDiscoveryResult>;
  /** Add a discovered PHP source through the source-inventory domain operation. */
  readonly includeSource: (sourceFile: SourceFile) => LaravelControllerSourceDiscoveryResult;
  /** Close discovery as blocked while preserving the already discovered partial inventory. */
  readonly block: (blocker: LaravelControllerSourceDiscoveryBlocker) => LaravelControllerSourceDiscoveryResult;
}

export type LaravelControllerSourceDiscoveryResult =
  | (Extract<LaravelControllerSourceDiscoveryEvidence, { readonly kind: 'laravel_controller_source_discovery_complete' }> & LaravelControllerSourceDiscoveryJudgmentOperations)
  | (Extract<LaravelControllerSourceDiscoveryEvidence, { readonly kind: 'laravel_controller_source_discovery_blocked' }> & LaravelControllerSourceDiscoveryJudgmentOperations);

/** Variant-owned construction keeps the upstream ADT from redispatching a union with ternaries. */
export interface LaravelControllerSourceDiscoveryFilesystemFailureInput {
  readonly sourceProject: SourceProjectIdentity;
  readonly root: SourceFile;
  readonly directory: SourceFile;
  readonly partialSources: SourceFileInventory;
  readonly failureCode: FilesystemFailureCode;
  readonly location: FilesystemFailureLocation;
  readonly failure: unknown;
}

export interface LaravelControllerSourceDiscoveryJudgmentFactoryInterface {
  readonly kind: 'laravel_controller_source_discovery_judgment_factory';
  readonly complete: (
    evidence: Extract<LaravelControllerSourceDiscoveryEvidence, { readonly kind: 'laravel_controller_source_discovery_complete' }>,
  ) => Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_complete' }>;
  readonly blocked: (
    evidence: Extract<LaravelControllerSourceDiscoveryEvidence, { readonly kind: 'laravel_controller_source_discovery_blocked' }>,
  ) => Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_blocked' }>;
  /** Owns the complete transition from typed filesystem failure evidence to a blocked discovery judgment. */
  readonly blockedByFilesystemFailure: (
    input: LaravelControllerSourceDiscoveryFilesystemFailureInput,
  ) => LaravelControllerSourceDiscoveryResult;
}

export const laravelControllerSourceDiscoveryJudgmentFactory: LaravelControllerSourceDiscoveryJudgmentFactoryInterface = Object.freeze({
  kind: 'laravel_controller_source_discovery_judgment_factory',
  blockedByFilesystemFailure: input => input.failureCode.createDiscoveryBlocker({
    root: input.root,
    directory: input.directory,
    location: input.location,
    failure: input.failure,
  }).blockDiscovery(Object.freeze({
    sourceProject: input.sourceProject,
    root: input.root,
    partialSources: input.partialSources,
  })),
  complete: (evidence): Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_complete' }> => {
    const judgment: Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_complete' }> = Object.freeze({
      ...evidence,
      projectForManifest: () => Object.freeze({
        kind: 'laravel_controller_source_discovery_manifest_complete' as const,
        sourceProject: evidence.sourceProject,
        root: evidence.root,
        sources: evidence.sources,
        preserveCompleteJudgment: () => judgment,
      }),
      continueCompleteDiscovery: continuation => continuation(evidence),
      includeSource: (sourceFile: SourceFile): LaravelControllerSourceDiscoveryResult =>
        laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
          ...evidence,
          sources: evidence.sources.include(sourceFile),
        })),
      block: (blocker: LaravelControllerSourceDiscoveryBlocker): LaravelControllerSourceDiscoveryResult =>
        laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({
          kind: 'laravel_controller_source_discovery_blocked',
          contractVersion: 4,
          sourceProject: evidence.sourceProject,
          root: evidence.root,
          partialSources: evidence.sources,
          blocker,
        })),
    });
    return judgment;
  },
  blocked: (evidence): Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_blocked' }> => {
    const judgment: Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_blocked' }> = Object.freeze({
      ...evidence,
      projectForManifest: () => Object.freeze({
        kind: 'laravel_controller_source_discovery_manifest_blocked' as const,
        sourceProject: evidence.sourceProject,
        root: evidence.root,
        partialSources: evidence.partialSources,
        blocker: evidence.blocker,
        preserveBlockedJudgment: () => judgment,
      }),
      continueCompleteDiscovery: () => Promise.resolve(judgment),
    includeSource: (_sourceFile: SourceFile): LaravelControllerSourceDiscoveryResult =>
      laravelControllerSourceDiscoveryJudgmentFactory.blocked(evidence),
      block: (_blocker: LaravelControllerSourceDiscoveryBlocker): LaravelControllerSourceDiscoveryResult =>
        laravelControllerSourceDiscoveryJudgmentFactory.blocked(evidence),
    });
    return judgment;
  },
});

/** A directory entry owns the domain operation that continues nested source discovery. */
export interface LaravelControllerSourceDiscoveryDirectoryContinuationInterface {
  readonly discoverNestedDirectory: () => Promise<LaravelControllerSourceDiscoveryResult>;
}

/** A symbolic-link entry owns the domain operation that blocks complete discovery. */
export interface LaravelControllerSourceDiscoverySymbolicLinkContinuationInterface {
  readonly blockUnresolvedSymbolicLink: () => Promise<LaravelControllerSourceDiscoveryResult>;
}

/** A PHP-source entry owns the domain operation that adds its canonical source identity. */
export interface LaravelControllerSourceDiscoveryPhpSourceContinuationInterface {
  readonly includePhpSource: () => Promise<LaravelControllerSourceDiscoveryResult>;
}

/** An ignored entry explicitly preserves the current discovery judgment. */
export interface LaravelControllerSourceDiscoveryIgnoredContinuationInterface {
  readonly preserveDiscoveryJudgment: () => Promise<LaravelControllerSourceDiscoveryResult>;
}

export interface LaravelControllerSourceDiscoveryEntryOperations {
  readonly continueDiscovery: () => Promise<LaravelControllerSourceDiscoveryResult>;
}

export type LaravelControllerSourceDiscoveryEntry =
  | (Readonly<{ readonly kind: 'laravel_controller_discovery_directory_entry'; readonly sourceFile: SourceFile }> & LaravelControllerSourceDiscoveryEntryOperations)
  | (Readonly<{ readonly kind: 'laravel_controller_discovery_symbolic_link_entry'; readonly sourceFile: SourceFile }> & LaravelControllerSourceDiscoveryEntryOperations)
  | (Readonly<{ readonly kind: 'laravel_controller_discovery_php_source_entry'; readonly sourceFile: SourceFile }> & LaravelControllerSourceDiscoveryEntryOperations)
  | (Readonly<{ readonly kind: 'laravel_controller_discovery_ignored_entry'; readonly sourceFile: SourceFile }> & LaravelControllerSourceDiscoveryEntryOperations);

/** Interface-first construction binds each upstream ADT variant to its specific domain continuation. */
export interface LaravelControllerSourceDiscoveryEntryFactoryInterface {
  readonly directory: (sourceFile: SourceFile, continuation: LaravelControllerSourceDiscoveryDirectoryContinuationInterface) => Extract<LaravelControllerSourceDiscoveryEntry, { readonly kind: 'laravel_controller_discovery_directory_entry' }>;
  readonly symbolicLink: (sourceFile: SourceFile, continuation: LaravelControllerSourceDiscoverySymbolicLinkContinuationInterface) => Extract<LaravelControllerSourceDiscoveryEntry, { readonly kind: 'laravel_controller_discovery_symbolic_link_entry' }>;
  readonly phpSource: (sourceFile: SourceFile, continuation: LaravelControllerSourceDiscoveryPhpSourceContinuationInterface) => Extract<LaravelControllerSourceDiscoveryEntry, { readonly kind: 'laravel_controller_discovery_php_source_entry' }>;
  readonly ignored: (sourceFile: SourceFile, continuation: LaravelControllerSourceDiscoveryIgnoredContinuationInterface) => Extract<LaravelControllerSourceDiscoveryEntry, { readonly kind: 'laravel_controller_discovery_ignored_entry' }>;
}

export const laravelControllerSourceDiscoveryEntryFactory: LaravelControllerSourceDiscoveryEntryFactoryInterface = Object.freeze({
  directory: (sourceFile, continuation) => {
    const evidence = Object.freeze({ kind: 'laravel_controller_discovery_directory_entry' as const, sourceFile });
    return Object.freeze({ ...evidence, continueDiscovery: () => continuation.discoverNestedDirectory() });
  },
  symbolicLink: (sourceFile, continuation) => {
    const evidence = Object.freeze({ kind: 'laravel_controller_discovery_symbolic_link_entry' as const, sourceFile });
    return Object.freeze({ ...evidence, continueDiscovery: () => continuation.blockUnresolvedSymbolicLink() });
  },
  phpSource: (sourceFile, continuation) => {
    const evidence = Object.freeze({ kind: 'laravel_controller_discovery_php_source_entry' as const, sourceFile });
    return Object.freeze({ ...evidence, continueDiscovery: () => continuation.includePhpSource() });
  },
  ignored: (sourceFile, continuation) => {
    const evidence = Object.freeze({ kind: 'laravel_controller_discovery_ignored_entry' as const, sourceFile });
    return Object.freeze({ ...evidence, continueDiscovery: () => continuation.preserveDiscoveryJudgment() });
  },
});

export interface LaravelControllerSourceDiscoveryInput {
  readonly kind: 'laravel_controller_source_discovery_input';
  readonly sourceProject: SourceProjectIdentity;
  readonly root: SourceFile;
}

/** Contract for deterministic, project-bound discovery; it does not interpret invocation semantics. */
export interface LaravelControllerSourceDiscoveryInterface {
  readonly kind: 'laravel_controller_source_discovery';
  readonly closed: true;
  readonly contractVersion: 4;
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

/** Input for the validated inventory's owned transition into manifest construction. */
export interface LaravelControllerInvocationSemanticJudgmentInventoryManifestBuildInput {
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
  readonly manifestBuilderPreparation: ManifestBuilderOperationPreparationInterface;
}

/** A domain transition that settles a complete rejection judgment in one operation. */
export interface LaravelControllerInvocationSemanticJudgmentInventoryRejectionResolution {
  readonly withRejections: (
    rejections: readonly LaravelControllerInvocationSemanticJudgmentInventoryRejection[],
  ) => LaravelControllerInvocationSemanticJudgmentInventoryResult;
}

/** Successful inventory closure owns the exact transition from its receipt to manifest construction. */
export interface LaravelControllerInvocationSemanticJudgmentInventoryValidated extends LaravelControllerInvocationSemanticJudgmentInventoryRejectionResolution {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated';
  readonly contractVersion: 13;
  readonly receipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
  readonly buildManifest: (input: LaravelControllerInvocationSemanticJudgmentInventoryManifestBuildInput) => Promise<ManifestBuilderJudgment>;
}

/** Rejected inventory closure preserves its source and rejection ledger through a named domain operation. */
export interface LaravelControllerInvocationSemanticJudgmentInventoryRejected extends LaravelControllerInvocationSemanticJudgmentInventoryRejectionResolution {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected';
  readonly contractVersion: 13;
  readonly sourceInventory: LaravelControllerSourceInventoryInterface;
  readonly rejections: readonly [
    LaravelControllerInvocationSemanticJudgmentInventoryRejection,
    ...LaravelControllerInvocationSemanticJudgmentInventoryRejection[],
  ];
  readonly preserveRejectedInventory: () => LaravelControllerInvocationSemanticJudgmentInventoryRejected;
}

/** Only the receipt-bearing validated variant may cross the Laravel controller scanner boundary. */
export type LaravelControllerInvocationSemanticJudgmentInventoryResult =
  | LaravelControllerInvocationSemanticJudgmentInventoryValidated
  | LaravelControllerInvocationSemanticJudgmentInventoryRejected;

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
      readonly sources: SourceFileInventory;
      readonly rejections: readonly never[];
    }>
  | Readonly<{
      readonly kind: 'source_identity_duplicates_found';
      readonly duplicates: SourceFileInventory;
      readonly rejections: readonly [
        Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_contains_duplicate_source' }>,
        ...Extract<LaravelControllerInvocationSemanticJudgmentInventoryRejection, { readonly kind: 'controller_source_inventory_contains_duplicate_source' }>[],
      ];
    }>;

/** Cardinality of invocation judgments related to one canonical source identity. */
export interface LaravelControllerInvocationJudgmentMatchCardinalityHandlers<Result> {
  readonly onNoMatch: (cardinality: Extract<LaravelControllerInvocationJudgmentMatchCardinality, { readonly kind: 'no_invocation_judgment_matches_source' }>) => Result;
  readonly onOneMatch: (cardinality: Extract<LaravelControllerInvocationJudgmentMatchCardinality, { readonly kind: 'one_invocation_judgment_matches_source' }>) => Result;
  readonly onMultipleMatches: (cardinality: Extract<LaravelControllerInvocationJudgmentMatchCardinality, { readonly kind: 'multiple_invocation_judgments_match_source' }>) => Result;
}

export interface LaravelControllerInvocationJudgmentMatchCardinalityOperations {
  readonly includeRelation: (relation: SourceFileIdentityRelationJudgment) => LaravelControllerInvocationJudgmentMatchCardinality;
  readonly continueWith: <Result>(handlers: LaravelControllerInvocationJudgmentMatchCardinalityHandlers<Result>) => Result;
}

export type LaravelControllerInvocationJudgmentMatchCardinality =
  | (Readonly<{ readonly kind: 'no_invocation_judgment_matches_source' }> & LaravelControllerInvocationJudgmentMatchCardinalityOperations)
  | (Readonly<{ readonly kind: 'one_invocation_judgment_matches_source' }> & LaravelControllerInvocationJudgmentMatchCardinalityOperations)
  | (Readonly<{ readonly kind: 'multiple_invocation_judgments_match_source' }> & LaravelControllerInvocationJudgmentMatchCardinalityOperations);

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
      readonly missingSources: SourceFileInventory;
      readonly multiplyJudgedSources: SourceFileInventory;
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
    sources: SourceFileInventory,
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
  readonly version: 13;
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
  version: 13,
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
