import type { ModelAst, RequestAst, ResourceAst } from '../../../types/upstream/ast';
import type { RouteSemanticFlow } from '../../../types/domain/routes';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { SourceDiscovery } from '../../../types/upstream/collections';

const discoveredItems = <T>(discovery: SourceDiscovery<T>, category: string): readonly T[] => {
  if (discovery.kind === 'not_scanned') {
    throw new Error(`CompleteSourceAst invariant violated: ${category} was not scanned before manifest projection.`);
  }

  return discovery.items;
};

export interface RouteManifestProjectionInputsInterface {
  readonly routeFlowsFromManifest: (manifest: RouteSyncManifest) => readonly RouteSemanticFlow[];
  readonly modelAstsFromManifest: (manifest: RouteSyncManifest) => readonly ModelAst[];
  readonly resourceAstsFromManifest: (manifest: RouteSyncManifest) => readonly ResourceAst[];
  readonly requestAstsFromManifest: (manifest: RouteSyncManifest) => readonly RequestAst[];
}

/** Typed runtime projection boundary used by manifest lowering/preflight. */
export const routeManifestProjectionInputs: RouteManifestProjectionInputsInterface = Object.freeze({
  routeFlowsFromManifest: (manifest: RouteSyncManifest): readonly RouteSemanticFlow[] =>
    Object.freeze(manifest.ast.ast.routeFlows),
  modelAstsFromManifest: (manifest: RouteSyncManifest): readonly ModelAst[] =>
    discoveredItems(manifest.ast.ast.models.items, 'models'),
  resourceAstsFromManifest: (manifest: RouteSyncManifest): readonly ResourceAst[] =>
    discoveredItems(manifest.ast.ast.resources.items, 'resources'),
  requestAstsFromManifest: (manifest: RouteSyncManifest): readonly RequestAst[] =>
    discoveredItems(manifest.ast.ast.requests.items, 'requests'),
});
