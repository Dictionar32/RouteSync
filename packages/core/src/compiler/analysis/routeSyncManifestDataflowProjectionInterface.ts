import type { UpstreamWiringInterface } from '../../types/interfaces/interfaceDependencyBoundary';
import type { RouteSyncManifestFlow } from '../../types/upstream/manifest';
import type { SemanticDataflowJudgment } from '../../types/upstream/semanticDataflow';
import type { Sequence } from '../../types/upstream/collections';
import type { SemanticDataflowIdentity } from '../../types/upstream/semanticDataflow';

/**
 * Downstream-owned wiring boundary from the upstream manifest flow into the
 * dataflow-specific consumer surface. Dataflow orchestration must not inspect
 * the complete Laravel source model merely to recover controller identity.
 */
export interface RouteSyncManifestDataflowProjectionInterface
  extends UpstreamWiringInterface<RouteSyncManifestFlow, RouteSyncManifestDataflowSurface> {}

export interface RouteSyncManifestDataflowControllerSurface {
  readonly controller: string;
  readonly action: string;
  /** Canonical upstream identity; downstream matching must not reconstruct controller slots. */
  readonly dataflowNode: SemanticDataflowIdentity;
}

/** Runtime-facing projection: closed judgments only, never raw semantic inputs. */
export interface RouteSyncManifestDataflowSurface {
  readonly kind: 'route_sync_manifest_dataflow_surface';
  /** Upstream has already completed semantic reasoning and proof closure. */
  readonly dataflowJudgments: Sequence<SemanticDataflowJudgment>;
  /** Runtime trust boundary: upstream-materialized policy payloads are re-decoded before execution. */
  readonly dataflowQueryPolicyContracts: readonly unknown[];
  readonly controllers: readonly RouteSyncManifestDataflowControllerSurface[];
}
