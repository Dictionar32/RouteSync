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
import type { SourceDiscovery } from '../../../types/upstream/collections';
import type { RouteManifestProjection } from './routeManifestProjectionInterface';

/** A complete manifest must never downgrade an unscanned source category to an empty collection. */
const discoveredItems = <T>(discovery: SourceDiscovery<T>, category: string): readonly T[] => {
    if (discovery.kind === 'not_scanned') {
        throw new Error(`CompleteSourceAst invariant violated: ${category} was not scanned before manifest lowering.`);
    }

    return discovery.items;
};

export interface RouteManifestAstProjectionOperationsInterface {
    readonly kind: 'route_manifest_ast_projection_operations';
    readonly routeFlows: (manifest: RouteSyncManifest) => readonly RouteSemanticFlow[];
    readonly models: (manifest: RouteSyncManifest) => readonly ModelAst[];
    readonly resources: (manifest: RouteSyncManifest) => readonly ResourceAst[];
    readonly channels: (manifest: RouteSyncManifest) => readonly BroadcastChannelDescriptor[];
}

export const routeManifestAstProjectionOperations: RouteManifestAstProjectionOperationsInterface = Object.freeze({
    kind: 'route_manifest_ast_projection_operations',
    routeFlows: (manifest: RouteSyncManifest): readonly RouteSemanticFlow[] =>
        Object.freeze(manifest.ast.ast.routeFlows),
    models: (manifest: RouteSyncManifest): readonly ModelAst[] =>
        discoveredItems(manifest.ast.ast.models.items, 'models'),
    resources: (manifest: RouteSyncManifest): readonly ResourceAst[] =>
        discoveredItems(manifest.ast.ast.resources.items, 'resources'),
    channels: (manifest: RouteSyncManifest): readonly BroadcastChannelDescriptor[] => {
        const channels = discoveredItems(manifest.ast.ast.channels.items, 'channels');
        return Object.freeze(channels.map(channel => {
            const common = {
                name: channel.semantic.name.value.value,
                pattern: channel.semantic.pattern.value.value,
                runtimePattern: channel.semantic.runtimePattern.value.value,
                parameters: channel.semantic.parameters,
            };
            return channel.semantic.channelKind.continueWith({
                public: () => Object.freeze({ ...common, kind: 'public' as const, isPrivate: false, isPresence: false }),
                private: () => Object.freeze({ ...common, kind: 'private' as const, isPrivate: true, isPresence: false }),
                presence: () => Object.freeze({ ...common, kind: 'presence' as const, isPrivate: true, isPresence: true }),
            });
        }));
    },
});

export interface RouteSyncManifestLoweringOperationsInterface {
    readonly lower: (
        manifest: RouteSyncManifest,
        baseURL: string,
        version: string,
        projection: RouteManifestProjection,
    ) => RouteManifest;
}

export const routeSyncManifestLoweringOperations: RouteSyncManifestLoweringOperationsInterface = Object.freeze({
    lower: (
        manifest: RouteSyncManifest,
        baseURL: string,
        version: string,
        projection: RouteManifestProjection,
    ): RouteManifest => {
        const routes = routeManifestAstProjectionOperations.routeFlows(manifest);
        const models = routeManifestAstProjectionOperations.models(manifest);
        const resources = routeManifestAstProjectionOperations.resources(manifest);
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
            channels: routeManifestAstProjectionOperations.channels(manifest),
            frontend: { kind: 'disabled' as const },
            pages: Object.freeze([]),
        });
    },
});


