import type { RouteSyncManifestFlow } from '../../types/upstream/manifest';
import type {
  RouteSyncManifestDataflowProjectionInterface,
  RouteSyncManifestDataflowSurface,
} from './routeSyncManifestDataflowProjectionInterface';
import type { Sequence } from '../../types/upstream/collections';
import type { ControllerActionFlowContract } from '../../types/upstream/highLevelContracts';

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, [...output, items.head]);

const controllerSurface = (controller: ControllerActionFlowContract) => Object.freeze({
  controller: controller.controller.value.value,
  action: controller.action.value.value,
  dataflowNode: controller.semantic.dataflow.node,
});

export const routeSyncManifestDataflowProjection: RouteSyncManifestDataflowProjectionInterface = Object.freeze({
  project: (manifest: RouteSyncManifestFlow): RouteSyncManifestDataflowSurface => Object.freeze({
    kind: 'route_sync_manifest_dataflow_surface' as const,
    dataflowJudgments: manifest.dataflowJudgments,
    dataflowQueryPolicyContracts: manifest.dataflowQueryPolicyContracts,
    controllers: Object.freeze(
      sequenceToArray(manifest.contracts.controllers).map(controllerSurface),
    ),
  }),
});

