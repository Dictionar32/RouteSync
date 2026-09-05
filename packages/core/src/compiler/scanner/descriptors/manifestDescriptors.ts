/**
 * manifestDescriptors.ts
 *
 * AST descriptors for RouteManifest and ResourceRouteGroup.
 *
 * @module core/compiler/scanner/descriptors/manifestDescriptors
 */

import {
    RouteManifest,
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ResourceRouteGroup,
    BroadcastChannelDescriptor,
    FrontendConfig,
    PageConfig,
    EndpointContract,
    ScannedEndpointContract
} from "../../../types/route";
import { RequestType, FormAction } from "../../artifacts/RequestTypesArtifact";
import { ObjectType } from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import { TypeDeriver } from "../subscanners/TypeDeriver";

export interface ScannedResourceRouteGroupParams {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly routes: readonly ParsedRoute[];
    readonly formActions: readonly FormAction[];
}

/**
 * Reusable Constructor: Scanned Resource Route Group Descriptor.
 */
export class ScannedResourceRouteGroupDescriptor implements ResourceRouteGroup {
    public readonly resourceName: string;
    public readonly formTypeName: string;
    public readonly routes: readonly ParsedRoute[];
    public readonly formActions: readonly FormAction[];

    constructor({ resourceName, formTypeName, routes, formActions }: ScannedResourceRouteGroupParams) {
        this.resourceName = resourceName;
        this.formTypeName = formTypeName;
        this.routes = Object.freeze([...routes]);
        this.formActions = Object.freeze([...formActions]);
        Object.freeze(this);
    }

    public static create({
        resourceName,
        formTypeName = `${resourceName}Form`,
        routes = [],
        formActions = []
    }: {
        readonly resourceName: string;
        readonly formTypeName?: string;
        readonly routes?: readonly ParsedRoute[];
        readonly formActions?: readonly FormAction[];
    }): ScannedResourceRouteGroupDescriptor {
        return new ScannedResourceRouteGroupDescriptor({
            resourceName,
            formTypeName,
            routes,
            formActions
        });
    }
}

export interface ScannedRouteManifestParams {
    readonly version: string;
    readonly baseURL: string;
    readonly routes: readonly ParsedRoute[];
    readonly contracts?: readonly EndpointContract[];
    readonly resources: readonly ParsedResource[];
    readonly models: readonly ParsedModel[];
    readonly routeGroups: readonly ResourceRouteGroup[];
    readonly requestTypes: readonly RequestType[];
    readonly semanticTypes: readonly ObjectType[];
    readonly generatedAt: string;
    readonly channels: readonly BroadcastChannelDescriptor[];
    readonly frontend: FrontendConfig | null;
    readonly pages: readonly PageConfig[];
}

/**
 * Reusable Constructor: Scanned Route Manifest Descriptor.
 */
export class ScannedRouteManifestDescriptor implements RouteManifest {
    public readonly version: string;
    public readonly baseURL: string;
    public readonly routes: readonly ParsedRoute[];
    public readonly contracts: readonly EndpointContract[];
    public readonly resources: readonly ParsedResource[];
    public readonly models: readonly ParsedModel[];
    public readonly routeGroups: readonly ResourceRouteGroup[];
    public readonly requestTypes: readonly RequestType[];
    public readonly semanticTypes: readonly ObjectType[];
    public readonly generatedAt: string;
    public readonly channels: readonly BroadcastChannelDescriptor[];
    public readonly frontend: FrontendConfig | null;
    public readonly pages: readonly PageConfig[];

    constructor(params: ScannedRouteManifestParams) {
        this.version = params.version;
        this.baseURL = params.baseURL;
        this.routes = Object.freeze(params.routes);
        const assembledContracts = params.contracts && params.contracts.length > 0
            ? params.contracts
            : params.routes.map(r => r.contract ?? ScannedEndpointContract.fromRoute(r));
        this.contracts = Object.freeze([...assembledContracts]);
        this.resources = Object.freeze(params.resources);
        this.models = Object.freeze(params.models);
        this.routeGroups = Object.freeze(params.routeGroups);
        this.requestTypes = Object.freeze(params.requestTypes);
        this.semanticTypes = Object.freeze(params.semanticTypes);
        this.generatedAt = params.generatedAt;
        this.channels = Object.freeze(params.channels);
        this.frontend = params.frontend;
        this.pages = Object.freeze([...params.pages]);
        Object.freeze(this);
    }

    public static create({
        version = "6.0.0",
        baseURL = "http://localhost/api",
        routes = [],
        contracts = [],
        resources = [],
        models = [],
        routeGroups = [],
        requestTypes = [],
        semanticTypes = [],
        generatedAt = new Date().toISOString(),
        channels = [],
        frontend = null,
        pages = []
    }: {
        readonly version?: string;
        readonly baseURL?: string;
        readonly routes?: readonly ParsedRoute[];
        readonly contracts?: readonly EndpointContract[];
        readonly resources?: readonly ParsedResource[];
        readonly models?: readonly ParsedModel[];
        readonly routeGroups?: readonly ResourceRouteGroup[];
        readonly requestTypes?: readonly RequestType[];
        readonly semanticTypes?: readonly ObjectType[];
        readonly generatedAt?: string;
        readonly channels?: readonly BroadcastChannelDescriptor[];
        readonly frontend?: FrontendConfig | null;
        readonly pages?: readonly PageConfig[];
    } = {}): ScannedRouteManifestDescriptor {
        const interner = new TypeInterner();
        const resolvedRequests = (requestTypes.length > 0)
            ? requestTypes
            : TypeDeriver.deriveRequestTypes(routes, resources, interner, models);
        const resolvedSemantics = (semanticTypes.length > 0)
            ? semanticTypes
            : TypeDeriver.deriveSemanticTypes(resources, models, interner, routes);

        return new ScannedRouteManifestDescriptor({
            version,
            baseURL,
            routes,
            contracts,
            resources,
            models,
            routeGroups,
            requestTypes: resolvedRequests,
            semanticTypes: resolvedSemantics,
            generatedAt,
            channels,
            frontend,
            pages
        });
    }

    public static empty(baseURL = "http://localhost/api", version = "6.0.0"): ScannedRouteManifestDescriptor {
        return new ScannedRouteManifestDescriptor({
            version,
            baseURL,
            routes: [],
            contracts: [],
            resources: [],
            models: [],
            routeGroups: [],
            requestTypes: [],
            semanticTypes: [],
            generatedAt: new Date().toISOString(),
            channels: [],
            frontend: null,
            pages: []
        });
    }
}
