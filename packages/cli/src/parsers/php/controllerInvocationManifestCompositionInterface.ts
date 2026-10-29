import type {
  LaravelControllerInvocationSemanticJudgmentInventoryResult,
  LaravelControllerSourceDiscoveryResult,
  PhpSourceDocumentReadResult,
  PhpSourceDocument,
  SourceProjectIdentity,
  SourceFile,
  SourceFileInventory,
  ManifestBuilderJudgment,
  LaravelControllerSourceDiscoveryInterface,
  PhpSourceDocumentReaderInterface,
  PhpSourceDocumentReadOperationRejectedEvidence,
  PhpSourceDocumentIdentityBindingInterface,
  PhpSourceDocumentIdentityBindingJudgment,
  PhpSourceInvocationSemanticPipelineInterface,
  LaravelControllerInvocationSemanticJudgmentAuthorityInterface,
  LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface,
  ManifestBuilderOperationPreparationInterface,
  PhpSourceInvocationSemanticPipelineDeliveryInterface,
  ControllerSourceProjectIdentityCanonicalizationResult,
  ControllerSourceProjectIdentityCanonicalizationBlockedEvidence,
  ControllerSourceProjectIdentityCanonicalizationInterface,
} from '@routesync/core';


/** Composition-level terminal ADT. Rejection remains typed data until the CLI requests a complete manifest. */
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

/** A reader dependency rejected its operation instead of returning a source-read judgment. */
export interface ControllerInvocationManifestSourceDocumentReadOperationRejectedJudgment {
  readonly kind: 'controller_invocation_manifest_source_document_read_operation_rejected';
  readonly sourceFiles: SourceFileInventory;
  readonly rejections: readonly PhpSourceDocumentReadOperationRejectedEvidence[];
}

export interface ControllerInvocationManifestSourceDocumentsBlockedJudgment {
  readonly kind: 'controller_invocation_manifest_source_documents_blocked';
  readonly partialDocuments: readonly PhpSourceDocument[];
  readonly blockedReads: readonly Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_blocked' }>[];
}

export interface ControllerInvocationManifestSourceProjectIdentityBlockedJudgment {
  readonly kind: 'controller_invocation_manifest_source_project_identity_blocked';
  readonly identity: ControllerSourceProjectIdentityCanonicalizationBlockedEvidence;
}

export interface ControllerInvocationManifestSourceDiscoveryBlockedJudgment {
  readonly kind: 'controller_invocation_manifest_source_discovery_blocked';
  readonly discovery: Extract<LaravelControllerSourceDiscoveryResult, { readonly kind: 'laravel_controller_source_discovery_blocked' }>;
}

/** Terminal failures preserve the complete domain judgment at the CLI boundary. */
export type ControllerInvocationManifestTerminalFailureEvidence =
  | Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_blocked' }>
  | ControllerInvocationManifestInventoryRejectedJudgment
  | ControllerInvocationManifestSourceDiscoveryBlockedJudgment
  | ControllerInvocationManifestSourceProjectIdentityBlockedJudgment
  | ControllerInvocationManifestSourceDocumentsBlockedJudgment
  | ControllerInvocationManifestSourceDocumentIdentityRejectedJudgment
  | ControllerInvocationManifestSourceDocumentReadOperationRejectedJudgment;

export interface ControllerInvocationManifestTerminalFailure extends Error {
  readonly kind: 'controller_invocation_manifest_terminal_failure';
  readonly judgment: ControllerInvocationManifestTerminalFailureEvidence;
}

/** A terminal judgment owns the only operation that can produce a successful manifest. */
export interface ControllerInvocationManifestTerminalOperationInterface {
  readonly requireCompleteManifest: () => Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_complete' }>['manifest'];
}

export type ControllerInvocationManifestCompleteJudgment = Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_complete' }> & ControllerInvocationManifestTerminalOperationInterface;
export type ControllerInvocationManifestBlockedJudgment = Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_blocked' }> & ControllerInvocationManifestTerminalOperationInterface;
export type ControllerInvocationManifestInventoryRejectedTerminal = ControllerInvocationManifestInventoryRejectedJudgment & ControllerInvocationManifestTerminalOperationInterface;
export type ControllerInvocationManifestSourceDiscoveryBlockedTerminal = ControllerInvocationManifestSourceDiscoveryBlockedJudgment & ControllerInvocationManifestTerminalOperationInterface;
export type ControllerInvocationManifestSourceProjectIdentityBlockedTerminal = ControllerInvocationManifestSourceProjectIdentityBlockedJudgment & ControllerInvocationManifestTerminalOperationInterface;
export type ControllerInvocationManifestSourceDocumentsBlockedTerminal = ControllerInvocationManifestSourceDocumentsBlockedJudgment & ControllerInvocationManifestTerminalOperationInterface;
export type ControllerInvocationManifestSourceDocumentIdentityRejectedTerminal = ControllerInvocationManifestSourceDocumentIdentityRejectedJudgment & ControllerInvocationManifestTerminalOperationInterface;
export type ControllerInvocationManifestSourceDocumentReadOperationRejectedTerminal = ControllerInvocationManifestSourceDocumentReadOperationRejectedJudgment & ControllerInvocationManifestTerminalOperationInterface;

/** Every runtime terminal is executable domain evidence, not a data-only union arm. */
export type ControllerInvocationManifest =
  | ControllerInvocationManifestCompleteJudgment
  | ControllerInvocationManifestBlockedJudgment
  | ControllerInvocationManifestInventoryRejectedTerminal
  | ControllerInvocationManifestSourceDiscoveryBlockedTerminal
  | ControllerInvocationManifestSourceProjectIdentityBlockedTerminal
  | ControllerInvocationManifestSourceDocumentsBlockedTerminal
  | ControllerInvocationManifestSourceDocumentIdentityRejectedTerminal
  | ControllerInvocationManifestSourceDocumentReadOperationRejectedTerminal;

/** Producer-side adapter binds upstream manifest judgments to their CLI domain operation. */
export interface ControllerInvocationManifestTerminalOperationsFactoryInterface {
  readonly complete: (judgment: Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_complete' }>) => ControllerInvocationManifestCompleteJudgment;
  readonly manifestBlocked: (judgment: Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_blocked' }>) => ControllerInvocationManifestBlockedJudgment;
  readonly inventoryRejected: (judgment: ControllerInvocationManifestInventoryRejectedJudgment) => ControllerInvocationManifestInventoryRejectedTerminal;
  readonly sourceDiscoveryBlocked: (judgment: ControllerInvocationManifestSourceDiscoveryBlockedJudgment) => ControllerInvocationManifestSourceDiscoveryBlockedTerminal;
  readonly sourceProjectIdentityBlocked: (judgment: ControllerInvocationManifestSourceProjectIdentityBlockedJudgment) => ControllerInvocationManifestSourceProjectIdentityBlockedTerminal;
  readonly sourceDocumentsBlocked: (judgment: ControllerInvocationManifestSourceDocumentsBlockedJudgment) => ControllerInvocationManifestSourceDocumentsBlockedTerminal;
  readonly sourceDocumentIdentityRejected: (judgment: ControllerInvocationManifestSourceDocumentIdentityRejectedJudgment) => ControllerInvocationManifestSourceDocumentIdentityRejectedTerminal;
  readonly sourceDocumentReadOperationRejected: (judgment: ControllerInvocationManifestSourceDocumentReadOperationRejectedJudgment) => ControllerInvocationManifestSourceDocumentReadOperationRejectedTerminal;
  /** Binds the upstream outcome-owned operation to the CLI terminal contract without redispatching on the judgment kind. */
  readonly fromManifestBuilderJudgment: (judgment: ManifestBuilderJudgment) => ControllerInvocationManifestCompleteJudgment | ControllerInvocationManifestBlockedJudgment;
}

/** Domain continuation for the composition request's first legal effect. */
export interface ControllerInvocationManifestCompositionInputContinuationInterface {
  readonly onBlocked: (
    identity: ControllerSourceProjectIdentityCanonicalizationBlockedEvidence,
  ) => Promise<ControllerInvocationManifest>;
  readonly onCanonicalized: (
    identity: Extract<ControllerSourceProjectIdentityCanonicalizationResult, { readonly kind: 'controller_source_project_identity_canonicalized' }>,
    routeSelection: LaravelRouteSourceSelectionIntent,
  ) => Promise<ControllerInvocationManifest>;
}

/** Request ADT owns the first domain continuation; consumers don't unpack and redispatch its fields. */
export interface ControllerInvocationManifestCompositionInputOperations {
  readonly continueToCanonicalization: (
    canonicalization: ControllerSourceProjectIdentityCanonicalizationInterface,
    continuation: ControllerInvocationManifestCompositionInputContinuationInterface,
  ) => Promise<ControllerInvocationManifest>;
}

export interface ControllerInvocationManifestCompositionInput extends ControllerInvocationManifestCompositionInputOperations {
  readonly kind: 'controller_invocation_manifest_composition_input';
  readonly sourceProject: SourceProjectIdentity;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
}

export interface ControllerInvocationManifestCompositionInputFactoryInterface {
  readonly create: (
    sourceProject: SourceProjectIdentity,
    routeSelection: LaravelRouteSourceSelectionIntent,
  ) => ControllerInvocationManifestCompositionInput;
}

/** Canonical interface-first constructor; operation wiring is owned by the input ADT. */
export const controllerInvocationManifestCompositionInputFactory: ControllerInvocationManifestCompositionInputFactoryInterface = Object.freeze({
  create: (sourceProject: SourceProjectIdentity, routeSelection: LaravelRouteSourceSelectionIntent): ControllerInvocationManifestCompositionInput => Object.freeze({
    kind: 'controller_invocation_manifest_composition_input',
    sourceProject,
    routeSelection,
    continueToCanonicalization: (canonicalization: ControllerSourceProjectIdentityCanonicalizationInterface, continuation: ControllerInvocationManifestCompositionInputContinuationInterface): Promise<ControllerInvocationManifest> =>
      canonicalization.canonicalize(Object.freeze({
        kind: 'controller_source_project_identity_canonicalization_input',
        sourceProject,
      })).then(identity => {
        switch (identity.kind) {
          case 'controller_source_project_identity_canonicalization_blocked':
            return continuation.onBlocked(identity.preserveFailureEvidence());
          case 'controller_source_project_identity_canonicalized':
            return continuation.onCanonicalized(Object.freeze({
              ...identity,
              canonical: identity.continueToSourceDiscoveryIdentity(),
            }), routeSelection);
        }
      }),
  }),
});

export interface ControllerInvocationManifestCompositionAuthorityInterface {
  readonly kind: 'controller_invocation_manifest_composition_authority';
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
  readonly kind: 'controller_invocation_manifest_builder';
  readonly contractVersion: 1;
  /** One explicit domain request replaces positional arguments at the runtime boundary. */
  readonly build: (input: ControllerInvocationManifestCompositionInput) => Promise<ControllerInvocationManifest>;
}

