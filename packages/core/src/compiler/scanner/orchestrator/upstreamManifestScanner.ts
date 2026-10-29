import { manifestBuilderOperationPreparation } from '../wiring/upstreamManifestBuilder';
import type { RouteSyncManifest, RouteSyncManifestFlow } from '../../../types/upstream/manifest';
import type { ManifestBuilderInput, ManifestBuilderJudgment, ManifestBuilderOperationPreparationInterface, ManifestBuilderFlowScanJudgment } from '../../../types/upstream/manifestBuilderInterface';
import type {
  RouteSyncManifestFlowScanJudgment,
  RouteSyncManifestScanOperationFactoryInterface,
  RouteSyncManifestScanOperationInput,
  RouteSyncManifestScanOperationInterface,
} from './RouteSyncManifestScanOperationInterface';
import type { RouteSyncManifestFlowProjectionInterface } from './RouteSyncManifestFlowProjectionInterface';

/** Public facade for all scanner operations; runtime behavior is carried by one typed object. */
export interface RouteSyncManifestScannerInterface {
  readonly flowProjection: RouteSyncManifestFlowProjectionInterface;
  readonly scanOperationFactory: RouteSyncManifestScanOperationFactoryInterface;
  readonly operation: RouteSyncManifestScanOperationInterface;
  readonly scanFlow: (input: RouteSyncManifestScanOperationInput) => Promise<RouteSyncManifestFlowScanJudgment>;
  readonly scanManifest: (input: RouteSyncManifestScanOperationInput) => Promise<ManifestBuilderJudgment>;
}

/** Canonical public downstream flow: AST/ADT interpretation stays upstream of this boundary. */
export const routeSyncManifestFlowProjection: RouteSyncManifestFlowProjectionInterface = Object.freeze({
  project: (manifest: RouteSyncManifest): RouteSyncManifestFlow => Object.freeze({
    kind: 'route_sync_manifest_flow' as const,
    version: manifest.version,
    source: manifest.source,
    contracts: manifest.sourceModel.contracts,
    relations: manifest.sourceModel.relations,
    dataflowInputs: manifest.dataflowInputs,
    dataflowJudgments: manifest.dataflowJudgments,
    dataflowQueryPolicyContracts: manifest.dataflowQueryPolicyContracts,
    resourceGroupCapabilities: manifest.resourceGroupCapabilities,
    invocationSemanticJudgments: manifest.invocationSemanticJudgments,
  }),
});

/** Factory implementation is a property on the interface-typed object, not a free function. */
export const routeSyncManifestScanOperationFactory: RouteSyncManifestScanOperationFactoryInterface = Object.freeze({
  create: (preparation: ManifestBuilderOperationPreparationInterface): RouteSyncManifestScanOperationInterface => {
    const toBuilderInput = (input: RouteSyncManifestScanOperationInput): ManifestBuilderInput => Object.freeze({
      kind: 'manifest_builder_input',
      invocationInventoryReceipt: input.invocationInventoryReceipt,
      routeSelection: input.routeSelection,
    });

    return Object.freeze({
      kind: 'routesync_manifest_scan_operation',
      contractVersion: 2,
      scanFlow: async (input: RouteSyncManifestScanOperationInput): Promise<RouteSyncManifestFlowScanJudgment> => {
        const judgment = await preparation.prepare(toBuilderInput(input)).build();
        return judgment.continueToFlow(routeSyncManifestFlowProjection);
      },
      scanManifest: async (input: RouteSyncManifestScanOperationInput): Promise<ManifestBuilderJudgment> =>
        preparation.prepare(toBuilderInput(input)).build(),
    });
  },
});

/** Runtime operation is wired through the typed factory to canonical preparation. */
export const routeSyncManifestScanOperation: RouteSyncManifestScanOperationInterface =
  routeSyncManifestScanOperationFactory.create(manifestBuilderOperationPreparation);

/** Stable runtime facade keeps both entry points explicitly typed and colocated. */
export const routeSyncManifestScanner: RouteSyncManifestScannerInterface = Object.freeze({
  flowProjection: routeSyncManifestFlowProjection,
  scanOperationFactory: routeSyncManifestScanOperationFactory,
  operation: routeSyncManifestScanOperation,
  scanFlow: (input: RouteSyncManifestScanOperationInput): Promise<RouteSyncManifestFlowScanJudgment> =>
    routeSyncManifestScanOperation.scanFlow(input),
  scanManifest: (input: RouteSyncManifestScanOperationInput): Promise<ManifestBuilderJudgment> =>
    routeSyncManifestScanOperation.scanManifest(input),
});
