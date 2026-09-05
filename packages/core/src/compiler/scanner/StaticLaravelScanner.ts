/**
 * StaticLaravelScanner.ts
 *
 * Slim Orchestrator & Backward-Compatible Facade for Laravel Project Scanning.
 * Coordinates specialized sub-scanners and re-exports all AST descriptors.
 *
 * @module core/compiler/scanner
 */

import {
    RouteManifest,
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ResourceRouteGroup,
    BroadcastChannelDescriptor,
    RouteParameter,
    ParsedColumn
} from "../../types/route";
import { RequestType } from "../artifacts/RequestTypesArtifact";
import { ObjectType } from "../types/SemanticType";
import { TypeInterner } from "../types/TypeInterner";

// Re-export all AST Descriptors (100% Backward Compatibility)
export * from "./descriptors";

// Re-export all Subscanners and Utilities
export * from "./subscanners";

import {
    StaticLaravelScannerOptions,
    ScannedResourceRouteGroupDescriptor,
    ScannedRouteManifestDescriptor
} from "./descriptors";

import {
    ChannelScanner,
    ControllerScanner,
    ResourceScanner,
    FormRequestScanner,
    ModelScanner,
    RouteScanner,
    InvalidationResolver,
    TypeDeriver,
    collectPhpFiles
} from "./subscanners";

export class StaticLaravelScanner {
    public readonly projectRoot: string;
    public readonly baseURL: string;
    public readonly version: string;
    private readonly interner: TypeInterner;

    /**
     * Reusable Constructor: Scanner Instance with Core Interner.
     */
    constructor({ projectRoot, baseURL, version }: StaticLaravelScannerOptions) {
        this.projectRoot = projectRoot;
        this.baseURL = baseURL;
        this.version = version;
        this.interner = new TypeInterner();
        Object.freeze(this);
    }

    public static create({
        projectRoot,
        baseURL = "http://localhost/api",
        version = "6.0.0"
    }: {
        readonly projectRoot: string;
        readonly baseURL?: string;
        readonly version?: string;
    }): StaticLaravelScanner {
        return new StaticLaravelScanner({ projectRoot, baseURL, version });
    }

    /**
     * Static Helper for 1-Line Execution.
     */
    static async scan(
        projectRoot: string,
        options: { readonly baseURL?: string; readonly version?: string } = {}
    ): Promise<RouteManifest> {
        const scanner = StaticLaravelScanner.create({
            projectRoot,
            baseURL: options.baseURL,
            version: options.version
        });
        return scanner.execute();
    }

    /**
     * Resolves cache invalidations directly on routes at the Origin Boundary (0 new Map, 0 wrapper, 0 if).
     */
    public static resolveRouteInvalidations(
        routes: readonly ParsedRoute[],
        models: readonly ParsedModel[],
        routeGroups: readonly ResourceRouteGroup[]
    ): readonly ParsedRoute[] {
        return InvalidationResolver.resolveRouteInvalidations(routes, models, routeGroups);
    }

    /**
     * Derives Canonical RequestType[] AST streams from parsed routes and resources.
     */
    public static deriveRequestTypes(
        routes: readonly ParsedRoute[] = [],
        resources: readonly ParsedResource[] = [],
        interner: TypeInterner = new TypeInterner(),
        models: readonly any[] = []
    ): readonly RequestType[] {
        return TypeDeriver.deriveRequestTypes(routes, resources, interner, models);
    }

    /**
     * Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
     */
    public static deriveSemanticTypes(
        resources: readonly ParsedResource[] = [],
        models: readonly ParsedModel[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        return TypeDeriver.deriveSemanticTypes(resources, models, interner, routes);
    }

    /**
     * Executes the complete scanning pipeline leveraging Core subsystems.
     */
    public async execute(): Promise<RouteManifest> {
        const resources = await this.scanResources();
        const models = await this.scanModels();
        const formRequests = await this.scanFormRequests();
        const routes = await this.scanRoutes(formRequests);
        const channels = await this.scanChannels();
        const derivedRequests = StaticLaravelScanner.deriveRequestTypes(routes, resources, this.interner);
        const requestTypes = formRequests.length > 0 ? formRequests : derivedRequests;
        const semanticTypes = StaticLaravelScanner.deriveSemanticTypes(resources, models, this.interner, routes);

        const groupMap = new Map<string, ParsedRoute[]>();
        for (const route of routes) {
            const list = groupMap.get(route.resourceName) || [];
            list.push(route);
            groupMap.set(route.resourceName, list);
        }
        const routeGroups: ResourceRouteGroup[] = Array.from(groupMap.entries()).map(([resName, rList]) =>
            ScannedResourceRouteGroupDescriptor.create({
                resourceName: resName,
                routes: rList,
                formTypeName: requestTypes.find(rt => rt.resourceName.toLowerCase() === resName.toLowerCase())?.formTypeName,
                formActions: requestTypes.find(rt => rt.resourceName.toLowerCase() === resName.toLowerCase())?.actions
            })
        );

        const resolvedRoutes = StaticLaravelScanner.resolveRouteInvalidations(routes, models, routeGroups);

        return new ScannedRouteManifestDescriptor({
            version: this.version,
            baseURL: this.baseURL,
            routes: resolvedRoutes,
            resources,
            models,
            routeGroups,
            requestTypes,
            semanticTypes,
            generatedAt: new Date().toISOString(),
            channels,
            frontend: null,
            pages: []
        });
    }

    /* Backward-compatible delegate methods */
    private async scanChannels(): Promise<readonly BroadcastChannelDescriptor[]> {
        return ChannelScanner.scan(this.projectRoot);
    }

    private async scanRoutes(requestTypes: readonly RequestType[] = []): Promise<readonly ParsedRoute[]> {
        return RouteScanner.scan(this.projectRoot, requestTypes);
    }

    private async scanControllers() {
        return ControllerScanner.scan(this.projectRoot);
    }

    private extractPathParams(routePath: string): readonly RouteParameter[] {
        return RouteScanner.extractPathParams(routePath);
    }

    private async collectPhpFiles(dir: string): Promise<string[]> {
        return collectPhpFiles(dir);
    }

    private async scanResources(): Promise<readonly ParsedResource[]> {
        return ResourceScanner.scan(this.projectRoot);
    }

    private async scanFormRequests(): Promise<readonly RequestType[]> {
        return FormRequestScanner.scan(this.projectRoot, this.interner);
    }

    private async scanModels(): Promise<readonly ParsedModel[]> {
        return ModelScanner.scan(this.projectRoot);
    }

    private async scanMigrations(): Promise<Map<string, ParsedColumn[]>> {
        return ModelScanner.scanMigrations(this.projectRoot);
    }

    private parseModelFile(source: string, modelName: string, migrationMap?: Map<string, ParsedColumn[]>): ParsedModel {
        return ModelScanner.parseModelFile(source, modelName, migrationMap);
    }
}
