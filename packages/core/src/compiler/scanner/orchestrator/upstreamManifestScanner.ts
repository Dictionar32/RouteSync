import { manifestBuilder } from '../wiring/upstreamManifestBuilder';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { RouteSyncManifest, RouteSyncManifestFlow } from '../../../types/upstream/manifest';
import type { RouteSyncManifestFlowProjectionInterface } from './RouteSyncManifestFlowProjectionInterface';

/**
 * Canonical public downstream flow.
 *
 * All AST/ADT interpretation is completed upstream. Only canonical semantic
 * contracts, relations, identity/provenance, and dataflow seeds cross this boundary.
 */
export const routeSyncManifestFlowProjection: RouteSyncManifestFlowProjectionInterface = Object.freeze({
  project: (manifest: RouteSyncManifest): RouteSyncManifestFlow => Object.freeze({
    kind: 'route_sync_manifest_flow' as const,
    version: manifest.version,
    source: manifest.source,
    contracts: manifest.sourceModel.contracts,
    relations: manifest.sourceModel.relations,
    dataflowInputs: manifest.dataflowInputs,
  }),
});

export const routeSyncManifestFlowFromManifest = (
  manifest: RouteSyncManifest,
): RouteSyncManifestFlow => routeSyncManifestFlowProjection.project(manifest);

export async function scanRouteSyncManifestFlow(
  sourceProject: SourceProjectIdentity
): Promise<RouteSyncManifestFlow> {
  return routeSyncManifestFlowFromManifest(await manifestBuilder.build(sourceProject));
}

/** Construction-side compatibility facade. Downstream code should consume the flow. */
export async function scanRouteSyncManifest(
  sourceProject: SourceProjectIdentity
): Promise<RouteSyncManifest> {
  return manifestBuilder.build(sourceProject);
}
