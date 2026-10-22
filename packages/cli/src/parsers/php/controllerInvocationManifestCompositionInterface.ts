import type {
  LaravelControllerInvocationSemanticJudgmentInventoryResult,
  LaravelControllerSourceDiscoveryResult,
  PhpSourceDocumentReadResult,
  PhpSourceDocument,
  SourceProjectIdentity,
  ManifestBuilderJudgment,
  LaravelControllerSourceDiscoveryInterface,
  PhpSourceDocumentReaderInterface,
  PhpSourceDocumentIdentityBindingInterface,
  PhpSourceDocumentIdentityBindingJudgment,
  PhpSourceInvocationSemanticPipelineInterface,
  LaravelControllerInvocationSemanticJudgmentAuthorityInterface,
  LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface,
  ManifestBuilderOperationPreparationInterface,
  PhpSourceInvocationSemanticPipelineDeliveryInterface,
} from '@routesync/core';
import type { LaravelRouteSourceSelectionIntent } from '@routesync/core';


/** Canonical project-root identity is established before discovery or inventory construction. */
export type ControllerSourceProjectIdentityCanonicalizationResult =
  | Readonly<{
      readonly kind: 'controller_source_project_identity_canonicalized';
      readonly requested: SourceProjectIdentity;
      readonly canonical: SourceProjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'controller_source_project_identity_canonicalization_blocked';
      readonly requested: SourceProjectIdentity;
    }>;

export interface ControllerSourceProjectIdentityCanonicalizationInput {
  readonly kind: 'controller_source_project_identity_canonicalization_input';
  readonly sourceProject: SourceProjectIdentity;
}

export interface ControllerSourceProjectIdentityCanonicalizationInterface {
  readonly kind: 'controller_source_project_identity_canonicalization';
  readonly contractVersion: 1;
  readonly canonicalize: (
    input: ControllerSourceProjectIdentityCanonicalizationInput,
  ) => Promise<ControllerSourceProjectIdentityCanonicalizationResult>;
}

/** Composition-level terminal ADT. Inventory rejection remains data and is never converted to an exception. */
export interface ControllerInvocationManifestInventoryRejectedJudgment {
  readonly kind: 'controller_invocation_manifest_inventory_rejected';
  readonly inventory: Extract<
    LaravelControllerInvocationSemanticJudgmentInventoryResult,
    { readonly kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected' }
  >;
}

export interface ControllerInvocationManifestSourceDocumentIdentityRejectedJudgment {
  readonly kind: 'controller_invocation_manifest_source_document_identity_rejected';
  readonly rejections: readonly Extract<PhpSourceDocumentIdentityBindingJudgment, { readonly kind: 'php_source_document_identity_rejected' }>[];
}

export interface ControllerInvocationManifestSourceDocumentsBlockedJudgment {
  readonly kind: 'controller_invocation_manifest_source_documents_blocked';
  readonly partialDocuments: readonly PhpSourceDocument[];
  readonly blockedReads: readonly Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_blocked' }>[];
}

export interface ControllerInvocationManifestSourceProjectIdentityBlockedJudgment {
  readonly kind: 'controller_invocation_manifest_source_project_identity_blocked';
  readonly identity: Extract<ControllerSourceProjectIdentityCanonicalizationResult, { readonly kind: 'controller_source_project_identity_canonicalization_blocked' }> ;
}

export interface ControllerInvocationManifestSourceDiscoveryBlockedJudgment {
  readonly kind: 'controller_invocation_manifest_source_discovery_blocked';
  readonly discovery: Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_blocked' }>;
}

export type ControllerInvocationManifest =
  | ManifestBuilderJudgment
  | ControllerInvocationManifestInventoryRejectedJudgment
  | ControllerInvocationManifestSourceDiscoveryBlockedJudgment
  | ControllerInvocationManifestSourceProjectIdentityBlockedJudgment
  | ControllerInvocationManifestSourceDocumentsBlockedJudgment
  | ControllerInvocationManifestSourceDocumentIdentityRejectedJudgment;

/** Closed workflow rules for the CLI adapter; semantic classification stays upstream. */
export interface ControllerInvocationManifestCompositionReasoningContract {
  readonly kind: 'controller_invocation_manifest_composition_reasoning_contract';
  readonly version: 11;
  readonly workflow: readonly [
    'canonicalize-source-project-root-identity-before-discovery-and-inventory-binding',
    'close-controller-root-discovery-before-asserting-source-inventory-completeness',
    'discover-all-controller-php-files-under-the-source-project-controller-root',
    'block-complete-inventory-when-an-unresolved-symbolic-link-is-encountered',
    'read-each-discovered-source-file-through-the-upstream-document-reader-contract',
    'bind-each-read-result-and-blocker-to-the-exact-requested-source-file-identity-before-inventory-construction',
    'create-one-source-document-for-each-successfully-read-file',
    'analyze-each-whole-file-exactly-once',
    'deliver-source-bound-pipeline-results-through-the-injected-upstream-delivery-operation',
    'publish-one-source-correlated-judgment-per-pipeline-result',
    'preserve-the-discovery-project-identity-as-inventory-subject-evidence',
    'bind-the-complete-discovered-source-inventory-to-the-requested-project-identity-through-upstream-identity-judgment',
    'close-the-total-source-to-judgment-correspondence-through-the-upstream-inventory-authority',
    'build-manifest-only-from-the-authority-produced-validated-receipt',
  ];
  readonly inventoryOutcomes: Readonly<{
    readonly validated: 'manifest-builder-receives-the-exact-authority-produced-receipt';
    readonly rejected: 'manifest-is-not-built-and-the-exact-upstream-rejection-adt-is-preserved-as-a-composition-terminal-judgment';
  }>;
  readonly semanticOwnership: 'core-authorities-own-semantic-judgment-and-inventory-closure-cli-only-discovers-wires-and-projects';
  readonly emptySourceSet: 'an-explicit-empty-source-inventory-is-closed-by-the-same-authority-and-is-not-inferred-as-a-missing-pipeline';
  readonly noReclassification: 'cli-must-not-classify-invocations-or-reconstruct-integrated-response-outcomes';
  readonly rejectionPreservation: 'rejected-terminal-outcome-retains-the-exact-upstream-rejection-adt-with-all-source-identities-and-rejection-details';
  readonly discoveryFailure: 'missing-unreadable-or-invalid-controller-root-is-a-blocked-discovery-judgment-not-an-empty-complete-inventory';
  readonly sourceReadFailure: 'missing-unreadable-or-invalid-source-file-is-a-blocked-document-acquisition-judgment-not-an-exception-or-omitted-source';
  readonly sourceIdentityMismatch: 'read-result-or-blocker-source-identity-mismatch-is-rejected-before-invocation-analysis-and-inventory-construction';
}

export interface ControllerInvocationManifestCompositionInput {
  readonly kind: 'controller_invocation_manifest_composition_input';
  readonly sourceProject: SourceProjectIdentity;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
}

export interface ControllerInvocationManifestCompositionAuthorityInterface {
  readonly kind: 'controller_invocation_manifest_composition_authority';
  readonly contract: ControllerInvocationManifestCompositionReasoningContract;
  readonly dependencies: ControllerInvocationManifestCompositionDependencies;
  readonly compose: (input: ControllerInvocationManifestCompositionInput) => Promise<ControllerInvocationManifest>;
}


/** Existing operation contracts used by composition are explicit dependencies, not hidden module lookups. */
export interface ControllerInvocationManifestCompositionDependencies {
  readonly sourceProjectIdentityCanonicalization: ControllerSourceProjectIdentityCanonicalizationInterface;
  readonly sourceDiscovery: LaravelControllerSourceDiscoveryInterface;
  readonly sourceDocumentReader: PhpSourceDocumentReaderInterface;
  readonly sourceDocumentIdentityBinding: PhpSourceDocumentIdentityBindingInterface;
  readonly sourceInvocationPipeline: PhpSourceInvocationSemanticPipelineInterface;
  readonly sourceInvocationPipelineDelivery: PhpSourceInvocationSemanticPipelineDeliveryInterface;
  readonly invocationJudgmentAuthority: LaravelControllerInvocationSemanticJudgmentAuthorityInterface;
  readonly inventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface;
  readonly manifestBuilderPreparation: ManifestBuilderOperationPreparationInterface;
}


/** Factory for the CLI manifest authority; the dependency bundle is always explicit. */
export interface ControllerInvocationManifestCompositionAuthorityFactoryInterface {
  readonly create: (
    dependencies: ControllerInvocationManifestCompositionDependencies,
  ) => ControllerInvocationManifestCompositionAuthorityInterface;
}

/** Public operation used by audit/drift callers to build the canonical manifest. */
export interface ControllerInvocationManifestBuilderInterface {
  readonly build: (
    sourceProject: SourceProjectIdentity,
    routeSelection: LaravelRouteSourceSelectionIntent,
  ) => Promise<ControllerInvocationManifest>;
}
