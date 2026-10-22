/**
 * Canonical downstream lowering from the completed upstream source model to
 * the compiler RouteManifest contract.
 *
 * The upstream scanner remains authoritative for semantic contracts. This
 * module only lowers those already-proven scanner emissions into the existing
 * downstream compiler vocabulary; it does not introduce a second scanner or
 * a compatibility descriptor.
 */

import type { RouteManifest } from './routeManifestInterface';
import type { BroadcastChannelDescriptor } from '../../../types/domain/channels';
import type { RouteSemanticFlow } from '../../../types/domain/routes';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { ModelAst, ResourceAst } from '../../../types/upstream/ast';
import { resourceModelKeyCapabilitiesFromAsts } from '../../../types/upstream/resourceModelKeyCapability';
import { matchDiscovered, matchSourceDiscovery } from '../../../types/upstream/collections';
import type { Sequence, SourceDiscovery } from '../../../types/upstream/collections';
import type { RouteManifestProjection } from './routeManifestProjectionInterface';

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

const routeFlowsFromManifest = (manifest: RouteSyncManifest): readonly RouteSemanticFlow[] =>
  Object.freeze(manifest.ast.ast.routeFlows);

const modelAsts = (manifest: RouteSyncManifest): readonly ModelAst[] =>
  discoveredMany(manifest.ast.ast.models.items);

const resourceAsts = (manifest: RouteSyncManifest): readonly ResourceAst[] =>
  discoveredMany(manifest.ast.ast.resources.items);

const channelDescriptorsFromManifest = (manifest: RouteSyncManifest): readonly BroadcastChannelDescriptor[] => {
    const channels = discoveredMany(manifest.ast.ast.channels.items);
    return Object.freeze(channels.map(channel => {
        const kind = channel.semantic.channelKind.kind;
        const parameters = sequenceToArray(channel.semantic.parameters);
        return Object.freeze({
            name: channel.semantic.name.value.value,
            kind,
            pattern: channel.semantic.pattern.value.value,
            runtimePattern: channel.semantic.runtimePattern.value.value,
            parameters,
            isPrivate: channel.semantic.requiresAuthentication.kind === 'true',
            isPresence: kind === 'presence',
        });
    }));
};


export const lowerRouteSyncManifestToRouteManifest: (
    manifest: RouteSyncManifest,
    baseURL: string,
    version: string,
    projection: RouteManifestProjection,
) => RouteManifest = (manifest, baseURL, version, projection) => {
    const routes = routeFlowsFromManifest(manifest);
    const models = modelAsts(manifest);
    const resources = resourceAsts(manifest);
    const resourceModelKeyCapabilities = resourceModelKeyCapabilitiesFromAsts(resources, models);

    return Object.freeze({
        version,
        baseURL,
        routes,
        resources,
        models,
        resourceModelKeyCapabilities,
        resourceGroupCapabilities: manifest.resourceGroupCapabilities,
        routeGroups: Object.freeze([]),
        requestTypes: projection.requestTypes,
        semanticTypes: projection.semanticTypes,
        generatedAt: new Date().toISOString(),
        channels: channelDescriptorsFromManifest(manifest),
        frontend: { kind: 'disabled' as const },
        pages: Object.freeze([]),
    });
};


