import type { ModelAst, RequestAst, ResourceAst } from '../../../types/upstream/ast';
import type { RouteSemanticFlow } from '../../../types/domain/routes';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { Sequence, SourceDiscovery } from '../../../types/upstream/collections';
import { matchDiscovered, matchSourceDiscovery } from '../../../types/upstream/collections';

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

const discoveredMany = <T>(discovery: SourceDiscovery<T>): readonly T[] =>
  matchSourceDiscovery(discovery, {
    notScanned: () => [],
    scanned: scanned => matchDiscovered(scanned.result, {
      empty: () => [],
      many: many => sequenceToArray(many.items),
    }),
  });

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
    discoveredMany(manifest.ast.ast.models.items),
  resourceAstsFromManifest: (manifest: RouteSyncManifest): readonly ResourceAst[] =>
    discoveredMany(manifest.ast.ast.resources.items),
  requestAstsFromManifest: (manifest: RouteSyncManifest): readonly RequestAst[] =>
    discoveredMany(manifest.ast.ast.requests.items),
});
