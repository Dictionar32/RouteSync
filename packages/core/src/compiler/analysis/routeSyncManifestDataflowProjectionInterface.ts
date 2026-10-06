import type { InterfaceDependencyBoundary } from '../../types/interfaces/interfaceDependencyBoundary';
import type { RouteSyncManifestFlow } from '../../types/upstream/manifest';
import type { ManifestDataflowSeedSurface } from '../../types/upstream/semanticDataflowManifestSurface';

/**
 * Downstream-owned wiring boundary from the upstream manifest flow into the
 * dataflow-specific consumer surface. Dataflow orchestration must not inspect
 * the complete Laravel source model merely to recover controller identity.
 */
export interface RouteSyncManifestDataflowProjectionInterface
  extends InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestDataflowSurface> {}

export interface RouteSyncManifestDataflowControllerSurface {
  readonly controller: string;
  readonly action: string;
}

export interface RouteSyncManifestDataflowSurface extends ManifestDataflowSeedSurface {
  readonly kind: 'route_sync_manifest_dataflow_surface';
  readonly controllers: readonly RouteSyncManifestDataflowControllerSurface[];
}
