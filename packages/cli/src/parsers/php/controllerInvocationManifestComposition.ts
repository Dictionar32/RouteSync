/** CLI composition root: filesystem discovery and dependency wiring only. */
import fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import { createLaravelSourceProjectIdentity, phpSourceDocumentReader, phpSourceDocumentIdentityBinding, phpSourceDocumentIdentityBindingBatchFactory, phpSourceDocumentReadResultFactory, phpSourceDocumentReadBlockerFactory, phpSourceDocumentReadBatchFactory, phpSourceDocumentReadOperationSettlementFactory, phpSourceDocumentReadOperationBatchFactory, phpSourceInvocationSemanticPipelineDelivery, filesystemFailureLocationFactory, laravelControllerInvocationSemanticJudgmentAuthority, laravelControllerSourceDiscoveryJudgmentFactory, laravelControllerSourceDiscoveryBlockerFactory, laravelControllerSourceDiscoveryEntryFactory, sourceFileInventoryFactory, laravelControllerInvocationSemanticJudgmentInventoryAuthority, laravelControllerInvocationSemanticJudgmentPreparationInputFactory, sourceFileIdentityFactory, stringValue, nodeFilesystemFailureObservation } from '@routesync/core';
import { manifestBuilderOperationPreparation } from '@routesync/core/upstream';
import type {
  ControllerSourceProjectIdentityCanonicalizationInterface,
  ControllerSourceProjectIdentityCanonicalizationBlockedJudgment,
  PhpSourceDocument,
  SourceFile,
  SourceProjectIdentity,
  LaravelControllerSourceDiscoveryInput,
  LaravelControllerSourceDiscoveryResult,
  LaravelControllerSourceDiscoveryEvidence,
  LaravelControllerSourceDiscoveryEntry,
  LaravelControllerSourceDiscoveryDirectoryContinuationInterface,
  LaravelControllerSourceDiscoverySymbolicLinkContinuationInterface,
  LaravelControllerSourceDiscoveryPhpSourceContinuationInterface,
  LaravelControllerSourceDiscoveryIgnoredContinuationInterface,
  LaravelControllerSourceInventoryInterface,
  SourceFileInventory,
  LaravelControllerSourceDiscoveryInterface,
  PhpSourceDocumentReadOperationSettlement,
  PhpSourceDocumentReadBlocker,
  PhpSourceDocumentReaderInterface,
  FilesystemFailureLocation,
  LaravelControllerInvocationSemanticJudgmentInventoryResult,
  LaravelRouteSourceSelectionIntent,
  ManifestBuilderOperationPreparationInterface,
} from '@routesync/core';
import { phpSourceInvocationSemanticPipelineOperations } from './sourceInvocationPipeline';
import { routeSyncCliManifestScanOperationFactory } from '../../manifestScanOperationInterface';
import type {
  ControllerInvocationManifest,
  ControllerInvocationManifestCompositionAuthorityInterface,
  ControllerInvocationManifestCompositionDependencies,
  ControllerInvocationManifestCompositionAuthorityFactoryInterface,
  ControllerInvocationManifestBuilderInterface,
  ControllerInvocationManifestTerminalOperationsFactoryInterface,
  ControllerInvocationManifestTerminalFailure,
  ControllerInvocationManifestTerminalFailureEvidence,
} from './controllerInvocationManifestCompositionInterface';

export const controllerSourceProjectIdentityCanonicalization: ControllerSourceProjectIdentityCanonicalizationInterface = Object.freeze({
  kind: 'controller_source_project_identity_canonicalization',
  contractVersion: 2,
  canonicalize: input => fs.realpath(input.sourceProject.root.value.value).then(
    canonicalRoot => {
      const canonical = input.sourceProject.queryPolicySelection.createSourceProjectIdentity(
        sourceFileIdentityFactory.create(stringValue.create(canonicalRoot)),
        createLaravelSourceProjectIdentity,
      );
      return Object.freeze({
        kind: 'controller_source_project_identity_canonicalized' as const,
        requested: input.sourceProject,
        canonical,
        continueToSourceDiscoveryIdentity: (): SourceProjectIdentity => canonical,
      });
    },
    failure => {
      const observation = nodeFilesystemFailureObservation.observe(failure);
      const failureCode = observation.failureCode;
      const location = filesystemFailureLocationFactory.root(sourceFileIdentityFactory.create(stringValue.create(input.sourceProject.root.value.value)));
      const evidence = Object.freeze({
        kind: 'controller_source_project_identity_canonicalization_blocked_evidence' as const,
        requested: input.sourceProject,
        failureCode,
        location,
        failureName: observation.failureName,
        failureMessage: observation.failureMessage,
      });
      return Object.freeze({
        kind: 'controller_source_project_identity_canonicalization_blocked' as const,
        requested: input.sourceProject,
        failureCode,
        location,
        failureName: observation.failureName,
        failureMessage: observation.failureMessage,
        preserveFailureEvidence: () => evidence,
      });
    },
  ),
});

interface ControllerDirectoryReadSettlementOperations {
  /** Resolves a filesystem read into the next source-discovery judgment without exposing a generic handler. */
  readonly resolveDiscovery: (
    operation: ControllerDirectoryEntriesOperationInterface,
    evidence: LaravelControllerSourceDiscoveryResult,
    sourceProject: SourceProjectIdentity,
    root: SourceFile,
    directory: SourceFile,
  ) => Promise<LaravelControllerSourceDiscoveryResult>;
}

type ControllerDirectoryReadSettlement =
  | (Readonly<{ readonly kind: 'controller_directory_read_entries'; readonly entries: readonly Dirent[] }> & ControllerDirectoryReadSettlementOperations)
  | (Readonly<{ readonly kind: 'controller_directory_read_blocked'; readonly result: LaravelControllerSourceDiscoveryResult }> & ControllerDirectoryReadSettlementOperations);

interface ControllerDirectoryReadSettlementFactoryInterface {
  readonly entries: (entries: readonly Dirent[]) => Extract<ControllerDirectoryReadSettlement, { readonly kind: 'controller_directory_read_entries' }>;
  readonly blocked: (result: LaravelControllerSourceDiscoveryResult) => Extract<ControllerDirectoryReadSettlement, { readonly kind: 'controller_directory_read_blocked' }>;
}

const controllerDirectoryReadSettlementFactory: ControllerDirectoryReadSettlementFactoryInterface = Object.freeze({
  entries: entries => {
    const evidence = Object.freeze({ kind: 'controller_directory_read_entries' as const, entries });
    return Object.freeze({
      ...evidence,
      resolveDiscovery: (operation, discoveryEvidence, sourceProject, root, directory) => operation.discover(
        evidence.entries,
        discoveryEvidence,
        sourceProject,
        root,
        directory,
      ),
    });
  },
  blocked: result => {
    const evidence = Object.freeze({ kind: 'controller_directory_read_blocked' as const, result });
    return Object.freeze({
      ...evidence,
      resolveDiscovery: () => Promise.resolve(evidence.result),
    });
  },
});

interface ControllerDirectoryEntryCursorTraversalOperations {
  readonly onExhausted: () => Promise<LaravelControllerSourceDiscoveryResult>;
  readonly onEntry: (entry: Dirent, remainingEntries: readonly Dirent[]) => Promise<LaravelControllerSourceDiscoveryResult>;
}

interface ControllerDirectoryEntryCursorOperations {
  readonly continueDirectoryTraversal: (operations: ControllerDirectoryEntryCursorTraversalOperations) => Promise<LaravelControllerSourceDiscoveryResult>;
}

type ControllerDirectoryEntryCursor =
  | (Readonly<{ readonly kind: 'controller_directory_entry_cursor_exhausted' }> & ControllerDirectoryEntryCursorOperations)
  | (Readonly<{ readonly kind: 'controller_directory_entry_cursor_ready'; readonly entry: Dirent; readonly remainingEntries: readonly Dirent[] }> & ControllerDirectoryEntryCursorOperations);

interface ControllerDirectoryEntryCursorFactoryInterface {
  readonly from: (entries: readonly Dirent[]) => ControllerDirectoryEntryCursor;
}

/** Filesystem-boundary contract: translate Node Dirent facts into the existing upstream domain entry ADT. */
interface ControllerDirectoryEntryContinuations {
  readonly directory: LaravelControllerSourceDiscoveryDirectoryContinuationInterface;
  readonly symbolicLink: LaravelControllerSourceDiscoverySymbolicLinkContinuationInterface;
  readonly phpSource: LaravelControllerSourceDiscoveryPhpSourceContinuationInterface;
  readonly ignored: LaravelControllerSourceDiscoveryIgnoredContinuationInterface;
}

interface ControllerDirectoryEntryClassificationInterface {
  readonly classify: (
    entry: Dirent,
    sourceFile: SourceFile,
    continuations: ControllerDirectoryEntryContinuations,
  ) => LaravelControllerSourceDiscoveryEntry;
}

/** Converts the platform iterator result once at the filesystem boundary into a continuation-owning cursor ADT. */
const controllerDirectoryEntryCursorFactory: ControllerDirectoryEntryCursorFactoryInterface = Object.freeze({
  from: entries => {
    for (const entry of entries) {
      const evidence = Object.freeze({
        kind: 'controller_directory_entry_cursor_ready' as const,
        entry,
        remainingEntries: entries.slice(1),
      });
      return Object.freeze({
        ...evidence,
        continueDirectoryTraversal: operations => operations.onEntry(evidence.entry, evidence.remainingEntries),
      });
    }
    const evidence = Object.freeze({ kind: 'controller_directory_entry_cursor_exhausted' as const });
    return Object.freeze({
      ...evidence,
      continueDirectoryTraversal: operations => operations.onExhausted(),
    });
  },
});

/** Keep platform predicates at the adapter boundary; downstream discovery consumes only the upstream ADT. */
const controllerDirectoryEntryClassification: ControllerDirectoryEntryClassificationInterface = Object.freeze({
  classify: (entry, sourceFile, continuations) => ([
    Object.freeze({ matches: entry.isDirectory(), create: () => laravelControllerSourceDiscoveryEntryFactory.directory(sourceFile, continuations.directory) }),
    Object.freeze({ matches: entry.isSymbolicLink(), create: () => laravelControllerSourceDiscoveryEntryFactory.symbolicLink(sourceFile, continuations.symbolicLink) }),
    Object.freeze({ matches: entry.isFile() && entry.name.endsWith('.php'), create: () => laravelControllerSourceDiscoveryEntryFactory.phpSource(sourceFile, continuations.phpSource) }),
  ].find(candidate => candidate.matches) ?? Object.freeze({
    matches: true,
    create: () => laravelControllerSourceDiscoveryEntryFactory.ignored(sourceFile, continuations.ignored),
  })).create(),
});

interface ControllerDirectoryEntriesOperationInterface {
  readonly discover: (
    entries: readonly Dirent[],
    evidence: LaravelControllerSourceDiscoveryResult,
    sourceProject: SourceProjectIdentity,
    root: SourceFile,
    directory: SourceFile,
  ) => Promise<LaravelControllerSourceDiscoveryResult>;
}

const controllerDirectoryEntriesOperation: ControllerDirectoryEntriesOperationInterface = Object.freeze({
  discover: (entries, evidence, sourceProject, root, directory): Promise<LaravelControllerSourceDiscoveryResult> =>
    controllerDirectoryEntryCursorFactory.from(entries).continueDirectoryTraversal({
      onExhausted: () => Promise.resolve(evidence),
      onEntry: async (entry, remainingEntries) => evidence.continueCompleteDiscovery(async complete => {
        const entryPath = path.join(directory.value.value, entry.name);
        const currentJudgment = laravelControllerSourceDiscoveryJudgmentFactory.complete(complete);
        const entrySourceFile = sourceFileIdentityFactory.create(stringValue.create(entryPath));
        const classifiedEntry = controllerDirectoryEntryClassification.classify(entry, entrySourceFile, Object.freeze({
          directory: Object.freeze({
            discoverNestedDirectory: () => controllerPhpSourceDiscoveryOperation.discover(
              sourceProject,
              root,
              entrySourceFile,
              complete.sources,
              filesystemFailureLocationFactory.directory(entrySourceFile),
            ),
          }),
          symbolicLink: Object.freeze({
            blockUnresolvedSymbolicLink: () => Promise.resolve(currentJudgment.block(laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(entrySourceFile))),
          }),
          phpSource: Object.freeze({
            includePhpSource: () => Promise.resolve(currentJudgment.includeSource(entrySourceFile)),
          }),
          ignored: Object.freeze({
            preserveDiscoveryJudgment: () => Promise.resolve(currentJudgment),
          }),
        }));
        const nextJudgment = await classifiedEntry.continueDiscovery();

        return nextJudgment.continueCompleteDiscovery(nextComplete => controllerDirectoryEntriesOperation.discover(
          remainingEntries,
          nextComplete,
          sourceProject,
          root,
          directory,
        ));
      }),
    }),
});

interface ControllerPhpSourceDiscoveryOperationInterface {
  readonly discover: (
    sourceProject: SourceProjectIdentity,
    root: SourceFile,
    directory: SourceFile,
    discovered: SourceFileInventory,
    location: FilesystemFailureLocation,
  ) => Promise<LaravelControllerSourceDiscoveryResult>;
}

const controllerPhpSourceDiscoveryOperation: ControllerPhpSourceDiscoveryOperationInterface = Object.freeze({
  discover: (sourceProject, root, directory, discovered, location): Promise<LaravelControllerSourceDiscoveryResult> => {
    const initialEvidence = laravelControllerSourceDiscoveryJudgmentFactory.complete(Object.freeze({
      kind: 'laravel_controller_source_discovery_complete',
      contractVersion: 4,
      sourceProject,
      root,
      sources: discovered,
    }));

    return fs.lstat(directory.value.value).then(
      directoryMetadata => directoryMetadata.isSymbolicLink()
        ? controllerDirectoryReadSettlementFactory.blocked(
            laravelControllerSourceDiscoveryJudgmentFactory.blocked(Object.freeze({
              kind: 'laravel_controller_source_discovery_blocked',
              contractVersion: 4,
              sourceProject,
              root,
              partialSources: discovered,
              blocker: laravelControllerSourceDiscoveryBlockerFactory.symbolicLinkEncountered(directory),
            })),
          )
        : fs.readdir(directory.value.value, { withFileTypes: true }).then(
            entries => controllerDirectoryReadSettlementFactory.entries(entries),
            error => {
              const observation = nodeFilesystemFailureObservation.observe(error);
              return controllerDirectoryReadSettlementFactory.blocked(
                laravelControllerSourceDiscoveryJudgmentFactory.blockedByFilesystemFailure({
                  sourceProject,
                  root,
                  directory,
                  partialSources: discovered,
                  failureCode: observation.failureCode,
                  location,
                  failure: error,
                }),
              );
            },
          ),
      error => {
        const observation = nodeFilesystemFailureObservation.observe(error);
        return controllerDirectoryReadSettlementFactory.blocked(
          laravelControllerSourceDiscoveryJudgmentFactory.blockedByFilesystemFailure({
            sourceProject,
            root,
            directory,
            partialSources: discovered,
            failureCode: observation.failureCode,
            location,
            failure: error,
          }),
        );
      },
    ).then(directoryReadSettlement => directoryReadSettlement.resolveDiscovery(
      controllerDirectoryEntriesOperation,
      initialEvidence,
      sourceProject,
      root,
      directory,
    ));
  },
});

const controllerSourceDiscovery: LaravelControllerSourceDiscoveryInterface = Object.freeze({
  kind: 'laravel_controller_source_discovery',
  closed: true,
  contractVersion: 4,
  symbolicLinkPolicy: 'block-complete-discovery-when-an-unresolved-symbolic-link-is-encountered',
  discover: async (input: LaravelControllerSourceDiscoveryInput): Promise<LaravelControllerSourceDiscoveryResult> => {
    const evidence = await controllerPhpSourceDiscoveryOperation.discover(
      input.sourceProject,
      input.root,
      input.root,
      sourceFileInventoryFactory.empty(),
      filesystemFailureLocationFactory.root(input.root),
    );
    return evidence;
  },
});

/** Runtime error keeps the rejected terminal judgment attached as structured evidence. */
class ControllerInvocationManifestTerminalFailureError extends Error implements ControllerInvocationManifestTerminalFailure {
  readonly kind = 'controller_invocation_manifest_terminal_failure' as const;

  constructor(
    readonly judgment: ControllerInvocationManifestTerminalFailureEvidence,
    message: string,
  ) {
    super(message);
    this.name = 'ControllerInvocationManifestTerminalFailureError';
  }
}

interface ControllerInvocationManifestTerminalFailureFactoryInterface {
  readonly create: (
    judgment: ControllerInvocationManifestTerminalFailureEvidence,
    message: string,
  ) => ControllerInvocationManifestTerminalFailure;
}

const controllerInvocationManifestTerminalFailureFactory: ControllerInvocationManifestTerminalFailureFactoryInterface = Object.freeze({
  create: (judgment, message) => new ControllerInvocationManifestTerminalFailureError(judgment, message),
});

/**
 * Terminal operation factory. A complete terminal yields its manifest directly;
 * every failed terminal throws an error that retains the full typed judgment.
 * This removes handler-object/visitor dispatch from scan, sync and drift audit.
 */
export const controllerInvocationManifestTerminalOperationsFactory: ControllerInvocationManifestTerminalOperationsFactoryInterface = Object.freeze({
  complete: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => judgment.manifest,
  }),
  manifestBlocked: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => {
      throw controllerInvocationManifestTerminalFailureFactory.create(judgment, `Manifest blocked by upstream manifest judgment: ${JSON.stringify(judgment)}`);
    },
  }),
  inventoryRejected: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => {
      throw controllerInvocationManifestTerminalFailureFactory.create(judgment, `Manifest blocked by controller-inventory judgment: ${JSON.stringify(judgment.inventory.rejections)}`);
    },
  }),
  sourceDiscoveryBlocked: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => {
      throw controllerInvocationManifestTerminalFailureFactory.create(judgment, `Manifest blocked by controller-source discovery: ${JSON.stringify(judgment.discovery.blocker)}`);
    },
  }),
  sourceProjectIdentityBlocked: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => {
      throw controllerInvocationManifestTerminalFailureFactory.create(judgment, `Manifest blocked by project-root identity canonicalization: ${judgment.identity.requested.root.value.value}`);
    },
  }),
  sourceDocumentsBlocked: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => {
      throw controllerInvocationManifestTerminalFailureFactory.create(judgment, `Controller source document acquisition blocked: ${JSON.stringify(judgment.blockedReads)}`);
    },
  }),
  sourceDocumentIdentityRejected: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => {
      throw controllerInvocationManifestTerminalFailureFactory.create(judgment, `Manifest blocked by source-document identity binding: ${JSON.stringify(judgment.rejections)}`);
    },
  }),
  sourceDocumentReadOperationRejected: judgment => Object.freeze({
    ...judgment,
    requireCompleteManifest: () => {
      throw controllerInvocationManifestTerminalFailureFactory.create(judgment, `Source-document reader operation rejected for ${judgment.sourceFiles.format(stringValue.create(', ')).value}`);
    },
  }),
  fromManifestBuilderJudgment: judgment => Object.freeze({
    // The upstream judgment owns the outcome-specific operation. The CLI only
    // binds that operation to its terminal contract; it does not redispatch on kind.
    ...judgment,
    requireCompleteManifest: () => judgment.requireCompleteManifest(),
  }),
});

interface InventoryClosureOperationInput {
  readonly inventoryResult: LaravelControllerInvocationSemanticJudgmentInventoryResult;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
  readonly manifestBuilderPreparation: ManifestBuilderOperationPreparationInterface;
}

interface InventoryClosureOperationInterface {
  readonly close: (input: InventoryClosureOperationInput) => Promise<ControllerInvocationManifest>;
}

const inventoryClosureOperation: InventoryClosureOperationInterface = Object.freeze({
  close: async ({ inventoryResult, routeSelection, manifestBuilderPreparation }) => {
    if (inventoryResult.kind === 'laravel_controller_invocation_semantic_judgment_inventory_validated') {
      return controllerInvocationManifestTerminalOperationsFactory.fromManifestBuilderJudgment(
        await inventoryResult.buildManifest(Object.freeze({ routeSelection, manifestBuilderPreparation })),
      );
    }
    return controllerInvocationManifestTerminalOperationsFactory.inventoryRejected(Object.freeze({
      kind: 'controller_invocation_manifest_inventory_rejected',
      inventory: inventoryResult.preserveRejectedInventory(),
    }));
  },
});

export const controllerInvocationManifestCompositionAuthorityFactory: ControllerInvocationManifestCompositionAuthorityFactoryInterface = Object.freeze({
  create: (dependencies: ControllerInvocationManifestCompositionDependencies): ControllerInvocationManifestCompositionAuthorityInterface => {
  const compose: ControllerInvocationManifestCompositionAuthorityInterface['compose'] = input =>
    input.continueToCanonicalization(dependencies.sourceProjectIdentityCanonicalization, {
      onBlocked: blockedIdentity => Promise.resolve(controllerInvocationManifestTerminalOperationsFactory.sourceProjectIdentityBlocked(Object.freeze({
        kind: 'controller_invocation_manifest_source_project_identity_blocked',
        identity: blockedIdentity,
      }))),
      onCanonicalized: (canonicalIdentity, routeSelection) => canonicalProjectCompositionOperation.compose(Object.freeze({
        sourceProject: canonicalIdentity.canonical,
        routeSelection,
        dependencies,
      })),
    });

  return Object.freeze({
    kind: 'controller_invocation_manifest_composition_authority',
    dependencies,
    compose,
  });
  },
});

interface CanonicalProjectCompositionOperationInput {
  readonly sourceProject: SourceProjectIdentity;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
  readonly dependencies: ControllerInvocationManifestCompositionDependencies;
}

interface CanonicalProjectCompositionOperationInterface {
  readonly compose: (input: CanonicalProjectCompositionOperationInput) => Promise<ControllerInvocationManifest>;
}

const canonicalProjectCompositionOperation: CanonicalProjectCompositionOperationInterface = Object.freeze({
  compose: async ({ sourceProject, routeSelection, dependencies }): Promise<ControllerInvocationManifest> => {
    const controllerDirectory = path.join(sourceProject.root.value.value, 'app', 'Http', 'Controllers');
    const discovery = await dependencies.sourceDiscovery.discover(Object.freeze({
      kind: 'laravel_controller_source_discovery_input',
      sourceProject,
      root: sourceFileIdentityFactory.create(stringValue.create(controllerDirectory)),
    }));
    const manifestProjection = discovery.projectForManifest();
    if (manifestProjection.kind === 'laravel_controller_source_discovery_manifest_blocked') {
      return Promise.resolve(controllerInvocationManifestTerminalOperationsFactory.sourceDiscoveryBlocked(Object.freeze({
        kind: 'controller_invocation_manifest_source_discovery_blocked',
        discovery: manifestProjection.preserveBlockedJudgment(),
      })));
    }
    return discoveredSourcesContinuationOperation.continue(Object.freeze({
      discoveredSources: manifestProjection.sources,
      discoverySourceProject: manifestProjection.sourceProject,
      sourceProject,
      routeSelection,
      dependencies,
    }));
  },
});

interface DiscoveredSourceReadSettlementOperationInterface {
  readonly readAll: (
    sources: SourceFileInventory,
    reader: PhpSourceDocumentReaderInterface,
  ) => Promise<readonly PhpSourceDocumentReadOperationSettlement[]>;
}

const discoveredSourceReadSettlementOperation: DiscoveredSourceReadSettlementOperationInterface = Object.freeze({
  readAll: async (sources, reader): Promise<readonly PhpSourceDocumentReadOperationSettlement[]> => {
    const scheduledReads = sources.toSourceFiles().map((requestedSourceFile): Promise<PhpSourceDocumentReadOperationSettlement> =>
      reader.read(Object.freeze({
        kind: 'php_source_document_read_input',
        sourceFile: requestedSourceFile,
      })).then(
        result => phpSourceDocumentReadOperationSettlementFactory.fulfilled(requestedSourceFile, result),
        failure => {
          const observation = nodeFilesystemFailureObservation.observe(failure);
          return phpSourceDocumentReadOperationSettlementFactory.rejected(requestedSourceFile, Object.freeze({
            kind: 'php_source_document_read_failure_evidence',
            failureCode: observation.failureCode,
            failureName: observation.failureName,
            failureMessage: observation.failureMessage,
          }));
        },
      ),
    );
    return Object.freeze(await Promise.all(scheduledReads));
  },
});

interface DiscoveredSourcesContinuationOperationInput {
  readonly discoveredSources: LaravelControllerSourceInventoryInterface['sources'];
  readonly discoverySourceProject: SourceProjectIdentity;
  readonly sourceProject: SourceProjectIdentity;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
  readonly dependencies: ControllerInvocationManifestCompositionDependencies;
}

interface DiscoveredSourcesContinuationOperationInterface {
  readonly continue: (input: DiscoveredSourcesContinuationOperationInput) => Promise<ControllerInvocationManifest>;
}

const discoveredSourcesContinuationOperation: DiscoveredSourcesContinuationOperationInterface = Object.freeze({
  continue: async ({ discoveredSources, discoverySourceProject, sourceProject, routeSelection, dependencies }): Promise<ControllerInvocationManifest> => {
    const settledSourceReads = await discoveredSourceReadSettlementOperation.readAll(
      discoveredSources,
      dependencies.sourceDocumentReader,
    );
    const operationReadBatch = phpSourceDocumentReadOperationBatchFactory.fromSettlements(settledSourceReads);
    if (operationReadBatch.kind === 'php_source_document_read_operation_batch_rejected') {
      const rejectedBatch = operationReadBatch.preserveRejectedEvidence();
      return Promise.resolve(controllerInvocationManifestTerminalOperationsFactory.sourceDocumentReadOperationRejected(Object.freeze({
        kind: 'controller_invocation_manifest_source_document_read_operation_rejected',
        sourceFiles: rejectedBatch.sourceFiles,
        rejections: rejectedBatch.rejections,
      })));
    }
    const identityBatch = operationReadBatch.bindIdentityBatch(
      phpSourceDocumentIdentityBindingBatchFactory,
      dependencies.sourceDocumentIdentityBinding,
    );
    if (identityBatch.kind === 'php_source_document_identity_binding_batch_rejected') {
      const rejectedBatch = identityBatch.preserveRejectedEvidence();
      return Promise.resolve(controllerInvocationManifestTerminalOperationsFactory.sourceDocumentIdentityRejected(Object.freeze({
        kind: 'controller_invocation_manifest_source_document_identity_rejected',
        rejections: rejectedBatch.rejections,
      })));
    }
    const boundReadBatch = identityBatch.toSourceReadBatch(phpSourceDocumentReadBatchFactory);
    if (boundReadBatch.kind === 'php_source_document_read_batch_blocked') {
      const blockedBatch = boundReadBatch.preserveBlockedEvidence();
      return Promise.resolve(controllerInvocationManifestTerminalOperationsFactory.sourceDocumentsBlocked(Object.freeze({
        kind: 'controller_invocation_manifest_source_documents_blocked',
        partialDocuments: blockedBatch.partialDocuments,
        blockedReads: Object.freeze(blockedBatch.blockedReads.map(blockedRead =>
          phpSourceDocumentReadResultFactory.blocked(blockedRead.sourceFile, blockedRead.blocker),
        )),
      })));
    }
    return completeDocumentsContinuationOperation.continue(Object.freeze({
      documents: boundReadBatch.provideDocumentsForSemanticPipeline(),
      discoverySourceProject,
      sourceProject,
      routeSelection,
      dependencies,
    }));
  },
});

interface CompleteDocumentsContinuationOperationInput {
  readonly documents: readonly PhpSourceDocument[];
  readonly discoverySourceProject: SourceProjectIdentity;
  readonly sourceProject: SourceProjectIdentity;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
  readonly dependencies: ControllerInvocationManifestCompositionDependencies;
}

interface CompleteDocumentsContinuationOperationInterface {
  readonly continue: (input: CompleteDocumentsContinuationOperationInput) => Promise<ControllerInvocationManifest>;
}

const completeDocumentsContinuationOperation: CompleteDocumentsContinuationOperationInterface = Object.freeze({
  continue: ({ documents, discoverySourceProject, sourceProject, routeSelection, dependencies }): Promise<ControllerInvocationManifest> => {
    const preparationInput = laravelControllerInvocationSemanticJudgmentPreparationInputFactory.create(Object.freeze({
      kind: 'laravel_controller_invocation_semantic_judgment_preparation_input',
      documents,
      discoverySourceProject,
      requestedSourceProject: sourceProject,
    }));
    const preparation = preparationInput.continueToPreparation(Object.freeze({
      pipeline: dependencies.sourceInvocationPipeline,
      delivery: dependencies.sourceInvocationPipelineDelivery,
      judgmentAuthority: dependencies.invocationJudgmentAuthority,
    }));
    return preparation.continueWith(prepared => {
      const inventoryResult = dependencies.inventoryAuthority.close(Object.freeze({
        kind: 'laravel_controller_invocation_semantic_judgment_inventory_input',
        sourceInventory: prepared.sourceInventory,
        judgments: prepared.judgments,
      }));
      return inventoryClosureOperation.close(Object.freeze({
        inventoryResult,
        routeSelection,
        manifestBuilderPreparation: dependencies.manifestBuilderPreparation,
      }));
    });
  },
});

const canonicalCompositionDependencies: ControllerInvocationManifestCompositionDependencies = Object.freeze({
  sourceProjectIdentityCanonicalization: controllerSourceProjectIdentityCanonicalization,
  sourceDiscovery: controllerSourceDiscovery,
  sourceDocumentReader: phpSourceDocumentReader,
  sourceDocumentIdentityBinding: phpSourceDocumentIdentityBinding,
  sourceInvocationPipeline: phpSourceInvocationSemanticPipelineOperations,
  sourceInvocationPipelineDelivery: phpSourceInvocationSemanticPipelineDelivery,
  invocationJudgmentAuthority: laravelControllerInvocationSemanticJudgmentAuthority,
  inventoryAuthority: laravelControllerInvocationSemanticJudgmentInventoryAuthority,
  manifestBuilderPreparation: manifestBuilderOperationPreparation,
});

/** Existing CLI consumers retain their entry point; the operation chain is explicitly wired. */
export const controllerInvocationManifestCompositionAuthority: ControllerInvocationManifestCompositionAuthorityInterface =
  controllerInvocationManifestCompositionAuthorityFactory.create(canonicalCompositionDependencies);

export const controllerInvocationManifestBuilder: ControllerInvocationManifestBuilderInterface = Object.freeze({
  kind: 'controller_invocation_manifest_builder',
  contractVersion: 1,
  build: (input: ControllerInvocationManifestCompositionInput): Promise<ControllerInvocationManifest> =>
    routeSyncCliManifestScanOperationFactory.create(controllerInvocationManifestCompositionAuthority).scan(input),
});
