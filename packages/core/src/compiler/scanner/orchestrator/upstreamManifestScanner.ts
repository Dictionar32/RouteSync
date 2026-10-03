import { constructRouteSyncManifest } from '../upstream/upstreamManifestBuilder';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { RouteSyncManifest, RouteSyncManifestFlow } from '../../../types/upstream/manifest';

/**
 * Canonical public downstream flow.
 *
 * All AST/ADT interpretation is completed upstream. Only the semantic model,
 * identity and provenance cross this boundary.
 */
export async function scanRouteSyncManifestFlow(
  sourceProject: SourceProjectIdentity
): Promise<RouteSyncManifestFlow> {
  const manifest = await constructRouteSyncManifest(sourceProject);
  return Object.freeze({
    kind: 'route_sync_manifest_flow' as const,
    version: manifest.version,
    source: manifest.source,
    sourceModel: manifest.sourceModel,
  });
}

/** Construction-side compatibility facade. Downstream code should consume the flow. */
export async function scanRouteSyncManifest(
  sourceProject: SourceProjectIdentity
): Promise<RouteSyncManifest> {
  return constructRouteSyncManifest(sourceProject);
}
