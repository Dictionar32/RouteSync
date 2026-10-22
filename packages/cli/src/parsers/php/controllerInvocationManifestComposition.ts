/** CLI composition root: filesystem discovery and dependency wiring only. */
import fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import {
  createSourceFile,
  createLaravelSourceProjectIdentity,
  manifestBuilderOperationPreparation,
  phpSourceDocumentIdentityBinding,
  phpSourceInvocationSemanticPipelineDelivery,
  stringValue,
  laravelControllerInvocationSemanticJudgmentAuthority,
  laravelControllerInvocationSemanticJudgmentInventoryAuthority,
} from '@routesync/core';
import type {
  PhpSourceDocument,
  SourceProjectIdentity,
  LaravelControllerSourceInventoryInterface,
  LaravelControllerSourceDiscoveryInput,
  LaravelControllerSourceDiscoveryResult,
  LaravelControllerSourceDiscoveryInterface,
  PhpSourceDocumentReadInput,
  PhpSourceDocumentReadResult,
  PhpSourceDocumentReaderInterface,
  LaravelControllerInvocationSemanticJudgmentInventoryResult,
  LaravelRouteSourceSelectionIntent,
  ManifestBuilderOperationPreparationInterface,
} from '@routesync/core';
import { phpSourceInvocationSemanticPipeline } from './sourceInvocationPipeline';
import { routeSyncCliManifestScanOperationFactory } from '../../manifestScanOperationInterface';
import type {
  ControllerInvocationManifest,
  ControllerInvocationManifestCompositionAuthorityInterface,
  ControllerInvocationManifestCompositionInput,
  ControllerInvocationManifestCompositionReasoningContract,
  ControllerInvocationManifestCompositionDependencies,
  ControllerInvocationManifestCompositionAuthorityFactoryInterface,
  ControllerInvocationManifestBuilderInterface,
  ControllerSourceProjectIdentityCanonicalizationInterface,
} from './controllerInvocationManifestCompositionInterface';

export const CONTROLLER_INVOCATION_MANIFEST_COMPOSITION_REASONING_CONTRACT: ControllerInvocationManifestCompositionReasoningContract = Object.freeze({
  kind: 'controller_invocation_manifest_composition_reasoning_contract',
  version: 11,
  workflow: Object.freeze([
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
  ] as const),
  inventoryOutcomes: Object.freeze({
    validated: 'manifest-builder-receives-the-exact-authority-produced-receipt',
    rejected: 'manifest-is-not-built-and-the-exact-upstream-rejection-adt-is-preserved-as-a-composition-terminal-judgment',
  }),
  semanticOwnership: 'core-authorities-own-semantic-judgment-and-inventory-closure-cli-only-discovers-wires-and-projects',
  emptySourceSet: 'an-explicit-empty-source-inventory-is-closed-by-the-same-authority-and-is-not-inferred-as-a-missing-pipeline',
  noReclassification: 'cli-must-not-classify-invocations-or-reconstruct-integrated-response-outcomes',
  rejectionPreservation: 'rejected-terminal-outcome-retains-the-exact-upstream-rejection-adt-with-all-source-identities-and-rejection-details',
  discoveryFailure: 'missing-unreadable-or-invalid-controller-root-is-a-blocked-discovery-judgment-not-an-empty-complete-inventory',
  sourceReadFailure: 'missing-unreadable-or-invalid-source-file-is-a-blocked-document-acquisition-judgment-not-an-exception-or-omitted-source',
  sourceIdentityMismatch: 'read-result-or-blocker-source-identity-mismatch-is-rejected-before-invocation-analysis-and-inventory-construction',
});

export const controllerSourceProjectIdentityCanonicalization: ControllerSourceProjectIdentityCanonicalizationInterface = Object.freeze({
  kind: 'controller_source_project_identity_canonicalization',
  contractVersion: 1,
  canonicalize: async input => {
    try {
      const canonicalRoot = await fs.realpath(input.sourceProject.root.value.value);
      return Object.freeze({
        kind: 'controller_source_project_identity_canonicalized',
        requested: input.sourceProject,
        canonical: createLaravelSourceProjectIdentity(
          canonicalRoot,
          input.sourceProject.dataflowQueryPolicyIntent,
        ),
      });
    } catch {
      return Object.freeze({
        kind: 'controller_source_project_identity_canonicalization_blocked',
        requested: input.sourceProject,
      });
    }
  },
});

const filesystemFailure = (
  sourceProject: SourceProjectIdentity,
  root: string,
  directory: string,
  partialPaths: readonly string[],
  error: unknown,
): LaravelControllerSourceDiscoveryResult => {
  const errorCode = error instanceof Error && 'code' in error ? error.code : 'UNKNOWN';
  const rootSource = createSourceFile(root);
  const directorySource = createSourceFile(directory);
  const blocker = errorCode === 'ENOENT'
    ? directory === root
      ? Object.freeze({ kind: 'controller_source_discovery_root_missing' as const, root: rootSource })
      : Object.freeze({ kind: 'controller_source_discovery_directory_missing' as const, directory: directorySource })
    : errorCode === 'ENOTDIR'
      ? Object.freeze({ kind: 'controller_source_discovery_path_not_directory' as const, directory: directorySource })
      : Object.freeze({ kind: 'controller_source_discovery_directory_unreadable' as const, directory: directorySource });
  return Object.freeze({
    kind: 'laravel_controller_source_discovery_blocked',
    contractVersion: 2,
    sourceProject,
    root: rootSource,
    partialSources: Object.freeze(partialPaths.map(createSourceFile)),
    blocker,
  });
};

const discoverControllerPhpFiles = async (
  sourceProject: SourceProjectIdentity,
  root: string,
  directory: string,
  discovered: readonly string[],
): Promise<LaravelControllerSourceDiscoveryResult> => {
  let entries: readonly Dirent[];
  try {
    const directoryMetadata = await fs.lstat(directory);
    if (directoryMetadata.isSymbolicLink()) {
      return Object.freeze({
        kind: 'laravel_controller_source_discovery_blocked',
        contractVersion: 2,
        sourceProject,
        root: createSourceFile(root),
        partialSources: Object.freeze(discovered.map(createSourceFile)),
        blocker: Object.freeze({
          kind: 'controller_source_discovery_symbolic_link_encountered',
          sourceFile: createSourceFile(directory),
        }),
      });
    }
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error: unknown) {
    return filesystemFailure(sourceProject, root, directory, discovered, error);
  }
  const orderedEntries = [...entries].sort((left, right) => left.name.localeCompare(right.name));
  let accumulated = [...discovered];
  for (const entry of orderedEntries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await discoverControllerPhpFiles(sourceProject, root, entryPath, accumulated);
      if (nested.kind === 'laravel_controller_source_discovery_blocked') return nested;
      accumulated = nested.sources.map(source => source.value.value);
    } else if (entry.isSymbolicLink()) {
      return Object.freeze({
        kind: 'laravel_controller_source_discovery_blocked',
        contractVersion: 2,
        sourceProject,
        root: createSourceFile(root),
        partialSources: Object.freeze(accumulated.map(createSourceFile)),
        blocker: Object.freeze({
          kind: 'controller_source_discovery_symbolic_link_encountered',
          sourceFile: createSourceFile(entryPath),
        }),
      });
    } else if (entry.isFile() && entry.name.endsWith('.php')) {
      accumulated.push(entryPath);
    }
  }
  return Object.freeze({
    kind: 'laravel_controller_source_discovery_complete',
    contractVersion: 2,
    sourceProject,
    root: createSourceFile(root),
    sources: Object.freeze(accumulated.map(createSourceFile)),
  });
};

const controllerSourceDiscovery: LaravelControllerSourceDiscoveryInterface = Object.freeze({
  kind: 'laravel_controller_source_discovery',
  closed: true,
  contractVersion: 2,
  symbolicLinkPolicy: 'block-complete-discovery-when-an-unresolved-symbolic-link-is-encountered',
  discover: (input: LaravelControllerSourceDiscoveryInput) => discoverControllerPhpFiles(
    input.sourceProject,
    input.root.value.value,
    input.root.value.value,
    Object.freeze([]),
  ),
});

const sourceDocumentReader: PhpSourceDocumentReaderInterface = Object.freeze({
  kind: 'php_source_document_reader',
  closed: true,
  contractVersion: 1,
  read: async (input: PhpSourceDocumentReadInput): Promise<PhpSourceDocumentReadResult> => {
    try {
      const content = await fs.readFile(input.sourceFile.value.value, 'utf8');
      return Object.freeze({
        kind: 'php_source_document_read_complete',
        document: Object.freeze({
          kind: 'php_source_document',
          sourceFile: input.sourceFile,
          content: Object.freeze({ kind: 'php_source_text', value: stringValue(content) }),
        }),
      });
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? error.code : 'UNKNOWN';
      const blocker = errorCode === 'ENOENT'
        ? Object.freeze({ kind: 'php_source_document_file_missing' as const, sourceFile: input.sourceFile })
        : errorCode === 'EISDIR' || errorCode === 'ENOTDIR'
          ? Object.freeze({ kind: 'php_source_document_path_not_file' as const, sourceFile: input.sourceFile })
          : Object.freeze({ kind: 'php_source_document_file_unreadable' as const, sourceFile: input.sourceFile });
      return Object.freeze({
        kind: 'php_source_document_read_blocked',
        sourceFile: input.sourceFile,
        blocker,
      });
    }
  },
});

const closeInventory = (
  inventoryResult: LaravelControllerInvocationSemanticJudgmentInventoryResult,
  routeSelection: ControllerInvocationManifestCompositionInput['routeSelection'],
  manifestBuilderPreparation: ManifestBuilderOperationPreparationInterface,
): Promise<ControllerInvocationManifest> => {
  switch (inventoryResult.kind) {
    case 'laravel_controller_invocation_semantic_judgment_inventory_validated':
      return manifestBuilderPreparation.prepare(Object.freeze({ kind: 'manifest_builder_input', invocationInventoryReceipt: inventoryResult.receipt, routeSelection })).build();
    case 'laravel_controller_invocation_semantic_judgment_inventory_rejected':
      return Promise.resolve(Object.freeze({ kind: 'controller_invocation_manifest_inventory_rejected', inventory: inventoryResult }));
    default: {
      const exhaustiveInventoryResult: never = inventoryResult;
      return Promise.resolve(exhaustiveInventoryResult);
    }
  }
};

export const controllerInvocationManifestCompositionAuthorityFactory: ControllerInvocationManifestCompositionAuthorityFactoryInterface = Object.freeze({
  create: (dependencies: ControllerInvocationManifestCompositionDependencies): ControllerInvocationManifestCompositionAuthorityInterface => {
  const compose: ControllerInvocationManifestCompositionAuthorityInterface['compose'] = async (input) => {
    const identity = await dependencies.sourceProjectIdentityCanonicalization.canonicalize(Object.freeze({
      kind: 'controller_source_project_identity_canonicalization_input',
      sourceProject: input.sourceProject,
    }));
    if (identity.kind === 'controller_source_project_identity_canonicalization_blocked') {
      return Object.freeze({
        kind: 'controller_invocation_manifest_source_project_identity_blocked',
        identity,
      });
    }
    const sourceProject = identity.canonical;
    const controllerDirectory = path.join(sourceProject.root.value.value, 'app', 'Http', 'Controllers');
    const discovery = await dependencies.sourceDiscovery.discover(Object.freeze({
      kind: 'laravel_controller_source_discovery_input',
      sourceProject,
      root: createSourceFile(controllerDirectory),
    }));
    if (discovery.kind === 'laravel_controller_source_discovery_blocked') {
      return Object.freeze({ kind: 'controller_invocation_manifest_source_discovery_blocked', discovery });
    }
    const sourceReadResults = await Promise.all(discovery.sources.map(async requestedSourceFile => Object.freeze({
      requestedSourceFile,
      result: await dependencies.sourceDocumentReader.read(Object.freeze({
        kind: 'php_source_document_read_input',
        sourceFile: requestedSourceFile,
      })),
    })));
    const identityBindings = Object.freeze(sourceReadResults.map(read => dependencies.sourceDocumentIdentityBinding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: read.requestedSourceFile,
      result: read.result,
    }))));
    const identityRejections = Object.freeze(identityBindings.flatMap(binding =>
      binding.kind === 'php_source_document_identity_rejected' ? [binding] : [],
    ));
    if (identityRejections.length > 0) {
      return Object.freeze({
        kind: 'controller_invocation_manifest_source_document_identity_rejected',
        rejections: identityRejections,
      });
    }
    const boundReadResults = Object.freeze(identityBindings.flatMap(binding =>
      binding.kind === 'php_source_document_identity_bound' ? [binding.result] : [],
    ));
    const documents = Object.freeze(boundReadResults.flatMap(result => result.kind === 'php_source_document_read_complete' ? [result.document] : []));
    const blockedReads = Object.freeze(boundReadResults.flatMap(result => result.kind === 'php_source_document_read_blocked' ? [result] : []));
    if (blockedReads.length > 0) {
      return Object.freeze({
        kind: 'controller_invocation_manifest_source_documents_blocked',
        partialDocuments: documents,
        blockedReads,
      });
    }
    const invocationPipelineDelivery = dependencies.sourceInvocationPipelineDelivery.deliver(
      Object.freeze(documents.map(document => dependencies.sourceInvocationPipeline.analyze(document))),
    );
    const judgments = Object.freeze(invocationPipelineDelivery.entries.map(pipelineResult =>
      dependencies.invocationJudgmentAuthority.judge({
        kind: 'controller_invocation_pipeline_provided',
        sourceFile: pipelineResult.document.sourceFile,
        pipelineResult,
      }),
    ));
    const sourceInventory: LaravelControllerSourceInventoryInterface = Object.freeze({
      kind: 'laravel_controller_source_inventory',
      contractVersion: 1,
      // Preserve discovery's claimed project as the inventory subject. The requested
      // project remains in the completeness witness so the upstream identity authority
      // can reject a discovery implementation that returns another project's inventory.
      sourceProject: discovery.sourceProject,
      sources: Object.freeze(documents.map(document => document.sourceFile)),
      completeness: Object.freeze({
        kind: 'laravel_controller_source_inventory_completeness_witness',
        sourceProject,
        obligations: Object.freeze([
          'source-project-identity-matches-the-inventory-project',
          'all-controller-source-files-discovered-for-the-source-project',
          'empty-controller-source-set-is-explicitly-certified-when-applicable',
          'each-source-file-identity-is-canonical-and-unique',
        ] as const),
      }),
    });
    const inventoryResult = dependencies.inventoryAuthority.close({
      kind: 'laravel_controller_invocation_semantic_judgment_inventory_input',
      sourceInventory,
      judgments,
    });
    return closeInventory(inventoryResult, input.routeSelection, dependencies.manifestBuilderPreparation);
  };

  return Object.freeze({
    kind: 'controller_invocation_manifest_composition_authority',
    contract: CONTROLLER_INVOCATION_MANIFEST_COMPOSITION_REASONING_CONTRACT,
    dependencies,
    compose,
  });
  },
});

const canonicalCompositionDependencies: ControllerInvocationManifestCompositionDependencies = Object.freeze({
  sourceProjectIdentityCanonicalization: controllerSourceProjectIdentityCanonicalization,
  sourceDiscovery: controllerSourceDiscovery,
  sourceDocumentReader,
  sourceDocumentIdentityBinding: phpSourceDocumentIdentityBinding,
  sourceInvocationPipeline: phpSourceInvocationSemanticPipeline,
  sourceInvocationPipelineDelivery: phpSourceInvocationSemanticPipelineDelivery,
  invocationJudgmentAuthority: laravelControllerInvocationSemanticJudgmentAuthority,
  inventoryAuthority: laravelControllerInvocationSemanticJudgmentInventoryAuthority,
  manifestBuilderPreparation: manifestBuilderOperationPreparation,
});

/** Existing CLI consumers retain their entry point; the operation chain is explicitly wired. */
export const controllerInvocationManifestCompositionAuthority: ControllerInvocationManifestCompositionAuthorityInterface =
  controllerInvocationManifestCompositionAuthorityFactory.create(canonicalCompositionDependencies);

export const controllerInvocationManifestBuilder: ControllerInvocationManifestBuilderInterface = Object.freeze({
  build: (
    sourceProject: SourceProjectIdentity,
    routeSelection: LaravelRouteSourceSelectionIntent,
  ): Promise<ControllerInvocationManifest> =>
    routeSyncCliManifestScanOperationFactory.create(controllerInvocationManifestCompositionAuthority).scan(Object.freeze({
      kind: 'controller_invocation_manifest_composition_input',
      sourceProject,
      routeSelection,
    })),
});
