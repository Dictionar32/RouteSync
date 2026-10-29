import { sourceFileInventoryFactory, type SourceFile, type SourceFileInventory } from './names';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import { laravelRouteScanOutcomeOperations, type LaravelRouteScanOutcome } from './laravelRouteScannerInterface';
import { phpSourceDocumentReadBatchFactory, type PhpSourceDocumentReadBatchJudgment, type PhpSourceDocumentReaderInterface, type PhpSourceDocumentReadResult } from './phpSourceFrontendInterface';

export type LaravelRouteSourceFileObservation =
  | Readonly<{ readonly kind: 'laravel_route_source_file_scanned'; readonly file: SourceFile }>
  | Readonly<{ readonly kind: 'laravel_route_source_file_absent_optional_default'; readonly file: SourceFile }>;

export interface LaravelRouteSourceObservationReady {
  readonly kind: 'laravel_route_source_observation_ready';
  readonly sourceFiles: readonly LaravelRouteSourceFileObservation[];
  readonly scannableSources: SourceFileInventory;
}

/** Capability for the one legal effect after a ready source observation. A blocked variant preserves itself. */
export interface LaravelRouteSourceObservationContinuationInterface {
  readonly scanReadyObservation: (
    observation: LaravelRouteSourceObservationReady & LaravelRouteSourceObservationReadyOperations,
    readBatch: PhpSourceDocumentReadBatchJudgment,
  ) => Promise<LaravelRouteScanOutcome>;
}

/** The ready variant owns the exact inventory that may proceed to source reading. */
export interface LaravelRouteSourceObservationReadyOperations {
  /** The domain continuation is the inventory itself; consumers do not replay source classification. */
  readonly continueWithScannableSources: () => SourceFileInventory;
  readonly continueToRouteScan: (
    reader: PhpSourceDocumentReaderInterface,
    continuation: LaravelRouteSourceObservationContinuationInterface,
  ) => Promise<LaravelRouteScanOutcome>;
}

export interface LaravelRouteSourceObservationBlockedOperations {
  /** The blocked continuation preserves the exact evidence; it cannot produce a read plan. */
  readonly preserveMissingSourceEvidence: () => SourceFileInventory;
  readonly continueToRouteScan: (
    reader: PhpSourceDocumentReaderInterface,
    continuation: LaravelRouteSourceObservationContinuationInterface,
  ) => Promise<LaravelRouteScanOutcome>;
}

export type LaravelRouteSourceObservationJudgment =
  | (LaravelRouteSourceObservationReady & LaravelRouteSourceObservationReadyOperations)
  | (LaravelRouteScanBlockedJudgment & LaravelRouteSourceObservationBlockedOperations);

/** Single constructor for the ready source-observation terminal; prevents duplicated operation wiring. */
export interface LaravelRouteSourceObservationReadyFactoryInterface {
  readonly create: (input: Readonly<{
    readonly sourceFiles: readonly LaravelRouteSourceFileObservation[];
    readonly scannableSources: SourceFileInventory;
  }>) => Extract<LaravelRouteSourceObservationJudgment, { readonly kind: 'laravel_route_source_observation_ready' }>;
}

export const laravelRouteSourceObservationReadyFactory: LaravelRouteSourceObservationReadyFactoryInterface = Object.freeze({
  create: ({ sourceFiles, scannableSources }: Readonly<{
    readonly sourceFiles: readonly LaravelRouteSourceFileObservation[];
    readonly scannableSources: SourceFileInventory;
  }>): Extract<LaravelRouteSourceObservationJudgment, { readonly kind: 'laravel_route_source_observation_ready' }> => {
    let judgment: Extract<LaravelRouteSourceObservationJudgment, { readonly kind: 'laravel_route_source_observation_ready' }>;
    judgment = Object.freeze({
      kind: 'laravel_route_source_observation_ready' as const,
      sourceFiles: Object.freeze([...sourceFiles]),
      scannableSources,
      continueWithScannableSources: (): SourceFileInventory => scannableSources,
      continueToRouteScan: async (reader: PhpSourceDocumentReaderInterface, continuation: LaravelRouteSourceObservationContinuationInterface): Promise<LaravelRouteScanOutcome> => {
        const selectedSources = scannableSources.toSourceFiles();
        const readResults: readonly PhpSourceDocumentReadResult[] = await Promise.all(selectedSources.map(sourceFile =>
          reader.read({ kind: 'php_source_document_read_input', sourceFile }),
        ));
        const readBatch = phpSourceDocumentReadBatchFactory.fromResults(readResults);
        return continuation.scanReadyObservation(judgment, readBatch);
      },
    });
    return judgment;
  },
});

/** Explicit source absence is a domain blocker and preserves the exact missing-file inventory. */
export interface LaravelRouteScanBlockedJudgment {
  readonly kind: 'laravel_route_scan_blocked';
  readonly contractVersion: 27;
  readonly reason: 'explicitly_selected_route_source_file_absent';
  readonly missingFiles: SourceFileInventory;
  readonly preserveMissingSourceEvidence: () => SourceFileInventory;
  readonly continueToRouteScan: (
    reader: PhpSourceDocumentReaderInterface,
    continuation: LaravelRouteSourceObservationContinuationInterface,
  ) => Promise<LaravelRouteScanOutcome>;
}

/** Source presence is modeled as domain evidence rather than leaking a boolean into selection policy. */
export interface LaravelRouteSourcePresenceHandlers<Result> {
  readonly onPresent: (sourceFile: SourceFile) => Result;
  readonly onAbsent: (sourceFile: SourceFile) => Result;
}

export interface LaravelRouteSourcePresenceJudgmentOperations {
  readonly continueWith: <Result>(handlers: LaravelRouteSourcePresenceHandlers<Result>) => Result;
}

export type LaravelRouteSourcePresenceJudgment =
  | (Readonly<{ readonly kind: 'laravel_route_source_present'; readonly sourceFile: SourceFile }> & LaravelRouteSourcePresenceJudgmentOperations)
  | (Readonly<{ readonly kind: 'laravel_route_source_absent'; readonly sourceFile: SourceFile }> & LaravelRouteSourcePresenceJudgmentOperations);

export interface LaravelRouteSourcePresenceJudgmentFactoryInterface {
  readonly present: (sourceFile: SourceFile) => Extract<LaravelRouteSourcePresenceJudgment, { readonly kind: 'laravel_route_source_present' }>;
  readonly absent: (sourceFile: SourceFile) => Extract<LaravelRouteSourcePresenceJudgment, { readonly kind: 'laravel_route_source_absent' }>;
}

export const laravelRouteSourcePresenceJudgmentFactory: LaravelRouteSourcePresenceJudgmentFactoryInterface = Object.freeze({
  present: (sourceFile: SourceFile): Extract<LaravelRouteSourcePresenceJudgment, { readonly kind: 'laravel_route_source_present' }> => Object.freeze({
    kind: 'laravel_route_source_present',
    sourceFile,
    continueWith: <Result>(handlers: LaravelRouteSourcePresenceHandlers<Result>): Result => handlers.onPresent(sourceFile),
  }),
  absent: (sourceFile: SourceFile): Extract<LaravelRouteSourcePresenceJudgment, { readonly kind: 'laravel_route_source_absent' }> => Object.freeze({
    kind: 'laravel_route_source_absent',
    sourceFile,
    continueWith: <Result>(handlers: LaravelRouteSourcePresenceHandlers<Result>): Result => handlers.onAbsent(sourceFile),
  }),
});

/** Filesystem boundary reports typed source-presence evidence; selection intent owns its meaning. */
export interface LaravelRouteSourcePresenceInterface {
  readonly kind: 'laravel_route_source_presence';
  readonly observe: (sourceFile: SourceFile) => LaravelRouteSourcePresenceJudgment;
}

export interface ExplicitRouteSourceSelectionOperations {
  /** Returns the selected domain inventory without an effect-only visitor callback. */
  readonly selectedSourceFiles: () => SourceFileInventory;
}

/** Each source-selection variant owns the operation that resolves its source evidence. */
/** Filesystem-boundary capability for resolving Laravel's conventional route sources. */
export interface LaravelDefaultRouteSourceResolutionInterface {
  readonly kind: 'laravel_default_route_source_resolution';
  readonly resolve: (sourceProject: SourceProjectIdentity) => SourceFileInventory;
}

/** Each intent continues the domain decision through an injected source-resolution capability. */
export interface LaravelRouteSourceSelectionIntentOperations {
  readonly resolveFilesFor: (
    sourceProject: SourceProjectIdentity,
    defaultSourceResolution: LaravelDefaultRouteSourceResolutionInterface,
  ) => SourceFileInventory;
  /** Classifies source absence according to this intent's domain semantics. */
  readonly observeFiles: (selectedFiles: SourceFileInventory, presence: LaravelRouteSourcePresenceInterface) => LaravelRouteSourceObservationJudgment;
}

export type LaravelRouteSourceSelectionIntent =
  | (Readonly<{ readonly kind: 'laravel_route_source_selection_default' }> & LaravelRouteSourceSelectionIntentOperations)
  | (Readonly<{ readonly kind: 'laravel_route_source_selection_explicit'; readonly selection: Extract<LaravelRouteSourceSelection, { readonly kind: 'explicit_route_files' }> }> & LaravelRouteSourceSelectionIntentOperations);

export type LaravelRouteSourceSelection =
  | Readonly<{
      readonly kind: 'project_route_files';
    }>
  | Readonly<{
      readonly kind: 'explicit_route_files';
      readonly inventory: SourceFileInventory;
    }> & ExplicitRouteSourceSelectionOperations;

export interface LaravelRouteSourceSelectionInterface {
  readonly kind: 'laravel_route_source_selection_authority';
  readonly projectDefaults: () => LaravelRouteSourceSelection;
  readonly defaultIntent: () => Extract<LaravelRouteSourceSelectionIntent, { readonly kind: 'laravel_route_source_selection_default' }>;
  readonly explicitIntent: (selection: Extract<LaravelRouteSourceSelection, { readonly kind: 'explicit_route_files' }>) => Extract<LaravelRouteSourceSelectionIntent, { readonly kind: 'laravel_route_source_selection_explicit' }>;
  readonly explicitFiles: (inventory: SourceFileInventory) => Extract<LaravelRouteSourceSelection, { readonly kind: 'explicit_route_files' }>;
}

export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object.freeze({
  kind: 'laravel_route_source_selection_authority',
  projectDefaults: () => Object.freeze({ kind: 'project_route_files' as const }),
  defaultIntent: () => Object.freeze({
    kind: 'laravel_route_source_selection_default' as const,
    resolveFilesFor: (
      sourceProject: SourceProjectIdentity,
      defaultSourceResolution: LaravelDefaultRouteSourceResolutionInterface,
    ): SourceFileInventory => defaultSourceResolution.resolve(sourceProject),
    observeFiles: (selectedFiles: SourceFileInventory, presence: LaravelRouteSourcePresenceInterface): LaravelRouteSourceObservationJudgment => {
      const sourceFiles: LaravelRouteSourceFileObservation[] = [];
      let scannableSources = sourceFileInventoryFactory.empty();
      selectedFiles.toSourceFiles().forEach(file => presence.observe(file).continueWith({
        onPresent: sourceFile => {
          sourceFiles.push(Object.freeze({ kind: 'laravel_route_source_file_scanned' as const, file: sourceFile }));
          scannableSources = scannableSources.include(sourceFile);
        },
        onAbsent: sourceFile => {
          sourceFiles.push(Object.freeze({ kind: 'laravel_route_source_file_absent_optional_default' as const, file: sourceFile }));
        },
      }));
      return laravelRouteSourceObservationReadyFactory.create({
        sourceFiles,
        scannableSources,
      });
    },
  }),
  explicitIntent: (selection: Extract<LaravelRouteSourceSelection, { readonly kind: 'explicit_route_files' }>) => Object.freeze({
    kind: 'laravel_route_source_selection_explicit' as const,
    selection,
    resolveFilesFor: (
      _sourceProject: SourceProjectIdentity,
      _defaultSourceResolution: LaravelDefaultRouteSourceResolutionInterface,
    ): SourceFileInventory => selection.inventory,
    observeFiles: (selectedFiles: SourceFileInventory, presence: LaravelRouteSourcePresenceInterface): LaravelRouteSourceObservationJudgment => {
      let missingFiles = sourceFileInventoryFactory.empty();
      selectedFiles.toSourceFiles().forEach(file => presence.observe(file).continueWith({
        onPresent: () => undefined,
        onAbsent: sourceFile => { missingFiles = missingFiles.include(sourceFile); },
      }));
      return missingFiles.continueWith({
        onSource: () => {
          let blocked: LaravelRouteScanBlockedJudgment & LaravelRouteSourceObservationBlockedOperations;
          blocked = Object.freeze({
            kind: 'laravel_route_scan_blocked',
            contractVersion: 27,
            reason: 'explicitly_selected_route_source_file_absent',
            missingFiles,
            preserveMissingSourceEvidence: (): SourceFileInventory => missingFiles,
            continueToRouteScan: (_reader: PhpSourceDocumentReaderInterface, _continuation: LaravelRouteSourceObservationContinuationInterface): Promise<LaravelRouteScanOutcome> => Promise.resolve(laravelRouteScanOutcomeOperations.sourceSelectionBlocked(blocked)),
          });
          return blocked;
        },
        onEmpty: () => {
          const sourceFiles: LaravelRouteSourceFileObservation[] = [];
          let scannableSources = sourceFileInventoryFactory.empty();
          selectedFiles.toSourceFiles().forEach(file => {
            sourceFiles.push(Object.freeze({ kind: 'laravel_route_source_file_scanned' as const, file }));
            scannableSources = scannableSources.include(file);
          });
          return laravelRouteSourceObservationReadyFactory.create({
            sourceFiles,
            scannableSources,
          });
        },
      });
    },
  }),
  explicitFiles: (inventory: SourceFileInventory) => Object.freeze({
    kind: 'explicit_route_files' as const,
    inventory,
    selectedSourceFiles: (): SourceFileInventory => inventory,
  }),
});
