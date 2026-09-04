/**
 * ManifestDescriptor.ts
 *
 * Origin Boundary Contract and Value Object for RouteManifest.
 * Pure Origin Boundary Gate (0 '?', 0 '??', 0 'undefined').
 *
 * @module cli/generators/utils
 */

import type {
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ResourceRouteGroup,
    BroadcastChannelDescriptor,
    FrontendConfig,
    PageConfig
} from '../../../../core/src/types/route';
import type { RequestType } from '../../../../core/src/compiler/artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../../core/src/compiler/types/SemanticType';

/**
 * Guaranteed Non-Nullable Complete Domain Contract (0 '?', 0 'undefined').
 */
export interface CompleteRouteManifest {
    readonly routes: readonly ParsedRoute[];
    readonly resources: readonly ParsedResource[];
    readonly models: readonly ParsedModel[];
    readonly routeGroups: readonly ResourceRouteGroup[];
    readonly requestTypes: readonly RequestType[];
    readonly semanticTypes: readonly ObjectType[];
    readonly channels: readonly BroadcastChannelDescriptor[];
    readonly frontend: FrontendConfig | null;
    readonly pages: readonly PageConfig[];
}

/**
 * Raw Input Options at Origin Boundary.
 */
export interface RawManifestInput {
    readonly routes: readonly ParsedRoute[];
    readonly resources: readonly ParsedResource[];
    readonly models: readonly ParsedModel[];
    readonly routeGroups: readonly ResourceRouteGroup[];
    readonly requestTypes: readonly RequestType[];
    readonly semanticTypes: readonly ObjectType[];
    readonly channels: readonly BroadcastChannelDescriptor[];
    readonly frontend: FrontendConfig ;
    readonly pages: readonly PageConfig[];
}

export class ManifestDescriptor implements CompleteRouteManifest {
    public readonly routes: readonly ParsedRoute[];
    public readonly resources: readonly ParsedResource[];
    public readonly models: readonly ParsedModel[];
    public readonly routeGroups: readonly ResourceRouteGroup[];
    public readonly requestTypes: readonly RequestType[];
    public readonly semanticTypes: readonly ObjectType[];
    public readonly channels: readonly BroadcastChannelDescriptor[];
    public readonly frontend: FrontendConfig;
    public readonly pages: readonly PageConfig[];

    /**
     * Origin Boundary Constructor utilizing Destructuring Defaults (0 '??', 0 '? :').
     */
    constructor({
        routes = [],
        resources = [],
        models = [],
        routeGroups = [],
        requestTypes = [],
        semanticTypes = [],
        channels = [],
        frontend = null,
        pages = []
    }: RawManifestInput = {}) {
        this.routes = Object.freeze(routes);
        this.resources = Object.freeze(resources);
        this.models = Object.freeze(models);
        this.routeGroups = Object.freeze(routeGroups);
        this.requestTypes = Object.freeze(requestTypes);
        this.semanticTypes = Object.freeze(semanticTypes);
        this.channels = Object.freeze(channels);
        this.frontend = frontend;
        this.pages = Object.freeze(pages);
        Object.freeze(this);
    }
}