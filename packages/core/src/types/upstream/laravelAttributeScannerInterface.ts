import type { AttributeAst } from './ast';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { ClassName, SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { PhpClassNameResolution, PhpQualifiedClassName } from './phpClassNameResolutionInterface';

/** Canonical Laravel contract identity; a short-name match is not sufficient evidence. */
export interface LaravelContextualAttributeContractIdentity {
  readonly kind: 'laravel_contextual_attribute_contract_identity';
  readonly qualifiedName: 'Illuminate\\Contracts\\Container\\ContextualAttribute';
}

/** Successful name-resolution evidence specialized to Laravel's exact contract identity. */
export type LaravelContextualAttributeContractResolution = Omit<
  Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolved' }>,
  'qualifiedName'
> & Readonly<{
  readonly qualifiedName: Readonly<{
    readonly kind: 'php_qualified_class_name';
    readonly value: Readonly<{
      readonly kind: 'string_value';
      readonly value: 'Illuminate\\Contracts\\Container\\ContextualAttribute';
    }>;
  }>;
}>;

/**
 * One inventory member whose successful resolution is statically narrowed to Laravel's exact
 * contextual-attribute contract identity. It retains the source declaration and its resolution
 * as one evidence object, so the implementation proof cannot independently pair a declaration
 * from one `implements` entry with the resolution from another entry.
 */
export type LaravelContextualAttributeResolvedInterfaceEvidence = Omit<
  LaravelAttributeResolvedInterfaceEvidence,
  'resolution'
> & Readonly<{
  readonly resolution: LaravelContextualAttributeContractResolution;
}>;

/**
 * Proof that a declared attribute implements Laravel's canonical contextual-attribute contract.
 * The proof points to one linked inventory member instead of duplicating its declaration and
 * resolution as independent fields. The producer must establish that this evidence is a member of
 * the complete declaration inventory before publishing the enclosing contextuality judgment.
 */
export interface LaravelContextualAttributeImplementationProof {
  readonly kind: 'laravel_contextual_attribute_implementation_proof';
  readonly contract: LaravelContextualAttributeContractIdentity;
  readonly interfaceEvidence: LaravelContextualAttributeResolvedInterfaceEvidence;
}

/** One interface name as it appeared in the PHP class declaration. */
export interface LaravelAttributeDeclaredInterfaceEvidence {
  readonly kind: 'laravel_attribute_declared_interface_evidence';
  readonly sourceName: ClassName;
  readonly source: SourceSpan;
}

/** A resolved interface remains linked to the exact source-level name that produced it. */
export interface LaravelAttributeResolvedInterfaceEvidence {
  readonly kind: 'laravel_attribute_resolved_interface_evidence';
  readonly declaration: LaravelAttributeDeclaredInterfaceEvidence;
  readonly resolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolved' }>;
}

/** A source-ordered sequence node for resolved `implements` entries. */
export type LaravelAttributeResolvedInterfaceSequence =
  | Readonly<{
      readonly kind: 'laravel_attribute_resolved_interface_sequence_empty';
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_resolved_interface_sequence_entry';
      readonly evidence: LaravelAttributeResolvedInterfaceEvidence;
      readonly rest: LaravelAttributeResolvedInterfaceSequence;
    }>;

/**
 * Closed, source-ordered inventory for a declaration whose every `implements` entry resolved.
 * The recursive sequence ADT represents the ordered entries without exposing a freely assembled
 * pair of parallel arrays. `closed` means the producer has enumerated the full source clause and
 * resolved every entry; if any entry is unresolved, the enclosing scan must be blocked instead.
 */
export interface LaravelAttributeResolvedInterfaceInventory {
  readonly kind: 'laravel_attribute_resolved_interface_inventory';
  readonly closed: true;
  readonly declarationSource: SourceSpan;
  readonly entries: LaravelAttributeResolvedInterfaceSequence;
}

/**
 * Contextual inventory partitions the resolved source-order sequence around the single proven
 * Laravel contract entry. The implementation proof is the member itself, not a detached pointer
 * that a consumer would need to compare against a second collection.
 */
export interface LaravelContextualAttributeResolvedInterfaceInventory {
  readonly kind: 'laravel_contextual_attribute_resolved_interface_inventory';
  readonly closed: true;
  readonly declarationSource: SourceSpan;
  readonly before: LaravelAttributeResolvedInterfaceSequence;
  readonly implementation: LaravelContextualAttributeImplementationProof;
  readonly after: LaravelAttributeResolvedInterfaceSequence;
}

/** One source-proven custom contextual-attribute declaration. */
export interface LaravelContextualAttributeDeclarationEvidence {
  readonly kind: 'laravel_contextual_attribute_declaration_evidence';
  /** Short source-level key retained for existing dependency consumers. */
  readonly identity: ClassName;
  /** Canonical PHP identity; consumers must not treat the short key as globally unique. */
  readonly qualifiedIdentity: PhpQualifiedClassName;
  readonly source: SourceSpan;
  /** Closed source-order inventory with the contextual implementation embedded as its member. */
  readonly interfaceInventory: LaravelContextualAttributeResolvedInterfaceInventory;
}

/** Negative classification is valid only when the entire declared-interface inventory is closed. */
export interface LaravelAttributeNonContextualDeclarationJudgment {
  readonly kind: 'laravel_attribute_non_contextual_declaration';
  readonly closed: true;
  readonly qualifiedIdentity: PhpQualifiedClassName;
  readonly source: SourceSpan;
  readonly interfaceInventory: LaravelAttributeResolvedInterfaceInventory;
}

/** Complete contextuality judgment consumed by AST projection; unresolved names cannot inhabit it. */
export type LaravelAttributeContextualityJudgment =
  | LaravelContextualAttributeDeclarationEvidence
  | LaravelAttributeNonContextualDeclarationJudgment;

/** Closed source-ordered sequence of contextual attribute declarations discovered in a project. */
export type LaravelContextualAttributeDeclarationSequence =
  | Readonly<{
      readonly kind: 'laravel_contextual_attribute_declaration_sequence_empty';
    }>
  | Readonly<{
      readonly kind: 'laravel_contextual_attribute_declaration_sequence_entry';
      readonly declaration: LaravelContextualAttributeDeclarationEvidence;
      readonly rest: LaravelContextualAttributeDeclarationSequence;
    }>;

/**
 * Closed inventory: an empty sequence means discovery completed within the declared
 * `app/Attributes` scan scope and found no contextual declarations. It does not claim that every
 * PHP source directory in the project was scanned. The recursive sequence preserves deterministic
 * source traversal order without making completeness depend on an array convention.
 */
export interface LaravelContextualAttributeInventory {
  readonly kind: 'laravel_contextual_attribute_inventory_complete';
  readonly closed: true;
  readonly sourceProject: SourceProjectIdentity;
  readonly scope: LaravelAttributeScanScope;
  readonly declarations: LaravelContextualAttributeDeclarationSequence;
}

/** One source declaration whose PHP class-name resolution could not be closed. */
export interface LaravelAttributeScanBlocker {
  readonly kind: 'laravel_attribute_scan_blocker';
  readonly source: SourceSpan;
  readonly resolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolution_blocked' }>;
}

/** The declared scan boundary; completeness is scoped to this Laravel directory, not the whole project. */
export interface LaravelAttributeScanScope {
  readonly kind: 'laravel_attribute_scan_scope';
  readonly sourceProject: SourceProjectIdentity;
  readonly relativeDirectory: 'app/Attributes';
}

/** Evidence that the declared scan directory was enumerated successfully, not inferred from an empty fallback. */
export interface LaravelAttributeDirectoryEnumerationEvidence {
  readonly kind: 'laravel_attribute_directory_enumeration_evidence';
  readonly closed: true;
  readonly sourceRoot: SourceFile;
  readonly directory: SourceFile;
  readonly scope: LaravelAttributeScanScope;
  readonly order: 'deterministic-relative-path-order';
}

/** A source-ordered ADT for the PHP files enumerated within the declared scan scope. */
export type LaravelAttributeSourceFileSequence =
  | Readonly<{
      readonly kind: 'laravel_attribute_source_file_sequence_empty';
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_source_file_sequence_entry';
      readonly sourceFile: SourceFile;
      readonly rest: LaravelAttributeSourceFileSequence;
    }>;

/** Per-file semantic evidence is nested under the path that was actually enumerated. */
export interface LaravelAttributeScannedFileEvidence {
  readonly kind: 'laravel_attribute_scanned_file_evidence';
  readonly attribute: AttributeAst;
  readonly contextuality: LaravelAttributeContextualityJudgment;
}

/**
 * One source-ordered coverage sequence is the authority for both the enumerated path and its
 * completed evidence. This avoids two independently assembled path/evidence sequences whose
 * equality would otherwise exist only as an implementation comment.
 */
export type LaravelAttributeScannedFileSequence =
  | Readonly<{
      readonly kind: 'laravel_attribute_scanned_file_sequence_empty';
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_scanned_file_sequence_entry';
      readonly sourceFile: SourceFile;
      readonly evidence: LaravelAttributeScannedFileEvidence;
      readonly rest: LaravelAttributeScannedFileSequence;
    }>;

/**
 * Closed discovery receipt binding successful enumeration to the exact scan scope and one
 * source-ordered file-coverage sequence. Each file path and its completed AST/contextuality
 * evidence inhabit the same sequence node; no parallel enumerated/scanned lists need comparing.
 *
 * Contract invariant: `sourceProject` and `scope` must denote the same scan as the enclosing
 * `LaravelAttributeScanCompleteJudgment` and its `contextualAttributeInventory`. Consumers must
 * accept the receipt atomically; they must not reconstruct coverage by comparing independently
 * collected paths, AST arrays, or short class names. Filesystem completeness still requires
 * explicit handling of missing/unreadable directories and files.
 */
export interface LaravelAttributeScanDiscoveryReceipt {
  readonly kind: 'laravel_attribute_scan_discovery_receipt';
  readonly closed: true;
  readonly sourceProject: SourceProjectIdentity;
  readonly scope: LaravelAttributeScanScope;
  /** One ordered node per enumerated file, bound directly to its completed evidence. */
  readonly files: LaravelAttributeScannedFileSequence;
  /** Explicitly binds the filesystem root and directory whose enumeration was completed. */
  readonly enumeration: LaravelAttributeDirectoryEnumerationEvidence;
}

/** Discovery failures are distinct from PHP name-resolution failures. */
export type LaravelAttributeDiscoveryBlocker =
  | Readonly<{
      readonly kind: 'laravel_attribute_discovery_root_missing';
      readonly root: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_discovery_root_unreadable';
      readonly root: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_discovery_scope_missing';
      readonly directory: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_discovery_directory_unreadable';
      readonly directory: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_source_file_unreadable';
      readonly sourceFile: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_declaration_parse_failed';
      readonly sourceFile: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_constructor_missing';
      readonly declarationSource: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_constructor_ambiguous';
      readonly declarationSource: SourceSpan;
      readonly candidates: readonly SourceSpan[];
    }>
  | Readonly<{
      readonly kind: 'laravel_attribute_constructor_inventory_blocked';
      readonly declarationSource: SourceSpan;
      readonly blockers: readonly SourceSpan[];
    }>;

/** Closed ordered ADT for one or more scan failures; no unconstrained parallel array is required. */
export type LaravelAttributeScanFailureSequence =
  | Readonly<{ readonly kind: 'laravel_attribute_scan_failure_sequence_entry'; readonly failure: LaravelAttributeScanFailure; readonly rest: LaravelAttributeScanFailureSequence }>
  | Readonly<{ readonly kind: 'laravel_attribute_scan_failure_sequence_end'; readonly failure: LaravelAttributeScanFailure }>;

/** Every blocked scan carries at least one typed reason, whether discovery or resolution failed. */
export type LaravelAttributeScanFailure = LaravelAttributeScanBlocker | LaravelAttributeDiscoveryBlocker;

/**
 * Complete products from one source-project attribute scan.
 *
 * Cross-field invariant: `sourceProject`, `discoveryReceipt.sourceProject`,
 * `discoveryReceipt.scope.sourceProject`, `contextualAttributeInventory.sourceProject`, and
 * `contextualAttributeInventory.scope.sourceProject` must all identify the same source project;
 * the receipt and inventory scopes must both be the declared `app/Attributes` scope. TypeScript
 * cannot prove object-value equality between these nested fields, so the scanner authority owns
 * this invariant and must publish the judgment only after establishing it. Downstream consumers
 * must not repair, reclassify, or silently normalize a contradictory complete judgment.
 */
export interface LaravelAttributeScanCompleteJudgment {
  readonly kind: 'laravel_attribute_scan_complete';
  readonly closed: true;
  readonly contractVersion: 20;
  readonly sourceProject: SourceProjectIdentity;
  readonly discoveryReceipt: LaravelAttributeScanDiscoveryReceipt;
  readonly contextualAttributeInventory: LaravelContextualAttributeInventory;
}

/**
 * A blocked scan publishes no completed file sequence or contextual inventory. Partial file-path
 * discovery is retained separately so missing/unreadable inputs cannot masquerade as an empty scan.
 */
export interface LaravelAttributeScanBlockedJudgment {
  readonly kind: 'laravel_attribute_scan_blocked';
  readonly closed: true;
  readonly contractVersion: 20;
  readonly sourceProject: SourceProjectIdentity;
  readonly partialDiscovery: Readonly<{
    readonly scope: LaravelAttributeScanScope;
    readonly discoveredSourceFiles: LaravelAttributeSourceFileSequence;
  }>;
  readonly blockers: LaravelAttributeScanFailureSequence;
}

/** Closed outcome algebra: only the complete variant carries consumable ASTs and inventory. */
export type LaravelAttributeScanJudgment =
  | LaravelAttributeScanCompleteJudgment
  | LaravelAttributeScanBlockedJudgment;

/**
 * Upstream contract for Laravel attribute declaration evidence.
 *
 * This is the sole scanner boundary for the attribute scan. The caller supplies the source-project
 * identity; the scanner owns the fixed `app/Attributes` scope and must not silently widen it.
 * Implementations must return one of the closed judgments
 * below, preserve source-correlated evidence, and report filesystem or resolution failure as typed
 * blockers. A missing `app/Attributes` directory is not equivalent to a successful empty scan.
 *
 * Contract v18 keeps the input at the project-identity level because the directory is a fixed
 * scanner policy, not a caller-selected semantic decision. The result must publish the canonical
 * scope in the receipt and contextual inventory, and echo the source project in the complete/blocked
 * judgment. TypeScript cannot prove runtime value identity across these repeated evidence fields;
 * the authority must establish it before publishing a complete judgment. Consumers must not repair
 * or normalize contradictions. A legacy implementation does not become compatible by changing only
 * its `contractVersion` literal.
 */
export interface LaravelAttributeScannerInterface {
  readonly kind: 'laravel_attribute_scanner';
  readonly closed: true;
  readonly contractVersion: 20;
  readonly scan: (sourceProject: SourceProjectIdentity) => Promise<LaravelAttributeScanJudgment>;
}
