/**
 * Canonical downstream lowering from the completed upstream source model to
 * the compiler RouteManifest contract.
 *
 * The upstream scanner remains authoritative for semantic contracts. This
 * module only lowers those already-proven scanner emissions into the existing
 * downstream compiler vocabulary; it does not introduce a second scanner or
 * a compatibility descriptor.
 */

import type { RouteManifest } from '../../../types/domain/base';
import type { BroadcastChannelDescriptor, BroadcastChannelKind } from '../../../types/domain/channels';
import type { ChannelAst } from '../../../types/upstream/ast';
import type { RouteSemanticFlow } from '../../../types/domain/routes';
import type { ModelAst, RequestAst, ResourceAst } from '../../../types/upstream/ast';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { Sequence, SourceDiscovery } from '../../../types/upstream/collections';
import { resourceGroupCapabilitiesFromRoutes } from '../../../types/upstream/resourceGroupCapability';
import { matchDiscovered, matchSourceDiscovery } from '../../../types/upstream/collections';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';
import { relationResolve, relationProject } from '../../../semantic/foundation/relationalSequence';
import { TypeDeriver } from '../subscanners';
import { TypeInterner } from '../../types/TypeInterner';

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
    relationResolve(
        relationEqual(items.kind, 'empty'),
        () => output,
        () => relationResolve(
            relationEqual(items.kind, 'cons'),
            () => sequenceToArray(items.tail, Object.freeze([...output, items.head])),
            () => output,
        ),
    );

const discoveredMany = <T>(discovery: SourceDiscovery<T>): readonly T[] =>
    matchSourceDiscovery(discovery, {
        notScanned: () => [],
        scanned: scanned => matchDiscovered(scanned.result, {
            empty: () => [],
            many: many => sequenceToArray(many.items),
        }),
    });

const routeFlowsFromManifest = (manifest: RouteSyncManifest): readonly RouteSemanticFlow[] => Object.freeze(manifest.ast.ast.routeFlows);

const channelKind = (kind: ChannelAst['semantic']['channelKind']): BroadcastChannelKind =>
    relationResolve(
        relationEqual(kind.kind, 'public'),
        () => 'public' as const,
        () => relationResolve(
            relationEqual(kind.kind, 'private'),
            () => 'private' as const,
            () => 'presence' as const,
        ),
    );

const channelDescriptorsFromManifest = (manifest: RouteSyncManifest): readonly BroadcastChannelDescriptor[] => {
    const channels = discoveredMany(manifest.ast.ast.channels.items);
    return Object.freeze(relationProject(channels, channel => {
        const kind = channelKind(channel.semantic.channelKind);
        const parameters = sequenceToArray(channel.semantic.parameters);
        const isPresence = relationEqual(kind, 'presence');
        const isPrivate = relationResolve(relationEqual(kind, 'public'), () => false, () => true);
        return Object.freeze({
            name: channel.semantic.name.value,
            kind,
            pattern: channel.semantic.pattern.value,
            runtimePattern: channel.semantic.runtimePattern.value,
            parameters,
            isPrivate,
            isPresence,
        });
    }));
};

const modelAsts = (manifest: RouteSyncManifest): readonly ModelAst[] => discoveredMany(manifest.ast.ast.models.items);
const resourceAsts = (manifest: RouteSyncManifest): readonly ResourceAst[] => discoveredMany(manifest.ast.ast.resources.items);
const requestAsts = (manifest: RouteSyncManifest): readonly RequestAst[] => discoveredMany(manifest.ast.ast.requests.items);

export function lowerRouteSyncManifestToRouteManifest(
    manifest: RouteSyncManifest,
    baseURL: string,
    version: string,
): RouteManifest {
    const routes = routeFlowsFromManifest(manifest);
    const models = modelAsts(manifest);
    const resources = resourceAsts(manifest);
    const requests = requestAsts(manifest);
    const interner = TypeInterner.create();

    return Object.freeze({
        version,
        baseURL,
        routes,
        resources,
        models,
        resourceGroupCapabilities: resourceGroupCapabilitiesFromRoutes(routes),
        routeGroups: Object.freeze([]),
        requestTypes: TypeDeriver.deriveRequestTypes(routes, resources, requests, interner),
        semanticTypes: TypeDeriver.deriveSemanticTypes(resources, models, interner, routes),
        generatedAt: new Date().toISOString(),
        channels: channelDescriptorsFromManifest(manifest),
        frontend: { kind: 'disabled' as const },
        pages: Object.freeze([]),
    });
}
