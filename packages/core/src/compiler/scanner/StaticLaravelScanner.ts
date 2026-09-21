/**
 * StaticLaravelScanner.ts
 *
 * Slim Orchestrator & Backward-Compatible Facade for Laravel Project Scanning.
 * Coordinates specialized sub-scanners and re-exports AST descriptors.
 * Active Consumer: Orchestrates Laravel project scanning pipeline.
 *
 * @module core/compiler/scanner/StaticLaravelScanner
 */

import type {
    RouteManifest,
    ParsedRoute,
    ParsedModel,
    ParsedResource,
    ResourceRouteGroup
} from "../../types/route";
import type { RequestType } from "../artifacts/RequestTypesArtifact";
import type { ObjectType } from "../types/SemanticType";
import type { ModelAst } from "../../types/upstream/ast";
import { TypeInterner } from "../types/TypeInterner";
import type { StaticLaravelScannerOptions } from "./descriptors";
import { InvalidationResolver, TypeDeriver } from "./subscanners";
import { executeScanPipeline } from "./orchestrator/index";
import { ScannerLegacyDelegates } from "./scannerLegacyDelegates";

export * from "./scannerExports";

export class StaticLaravelScanner extends ScannerLegacyDelegates {
    public readonly baseURL: string;
    public readonly version: string;

    constructor({
        projectRoot,
        baseURL = "http://localhost/api",
        version = "6.0.0"
    }: {
        readonly projectRoot: string;
        readonly baseURL?: string;
        readonly version?: string;
    }) {
        super(projectRoot, new TypeInterner());
        this.baseURL = baseURL;
        this.version = version;
        Object.freeze(this);
    }

    public static create(options: {
        readonly projectRoot: string;
        readonly baseURL?: string;
        readonly version?: string;
    }): StaticLaravelScanner {
        return new StaticLaravelScanner(options);
    }

    static async scan(
        projectRoot: string,
        options: { readonly baseURL?: string; readonly version?: string } = {}
    ): Promise<RouteManifest> {
        return StaticLaravelScanner.create({
            projectRoot,
            baseURL: options.baseURL,
            version: options.version
        }).execute();
    }

    public static resolveRouteInvalidations(
        routes: readonly ParsedRoute[],
        models: readonly ModelAst[],
        routeGroups: readonly ResourceRouteGroup[]
    ): readonly ParsedRoute[] {
        return InvalidationResolver.resolveRouteInvalidations(routes, models, routeGroups);
    }

    public static deriveRequestTypes(
        routes: readonly ParsedRoute[] = [],
        resources: readonly ParsedResource[] = [],
        interner: TypeInterner = new TypeInterner(),
        models: readonly ModelAst[] = []
    ): readonly RequestType[] {
        return TypeDeriver.deriveRequestTypes(routes, resources, interner, models);
    }

    public static deriveSemanticTypes(
        resources: readonly ParsedResource[] = [],
        models: readonly ModelAst[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        return TypeDeriver.deriveSemanticTypes(resources, models, interner, routes);
    }

    public async execute(): Promise<RouteManifest> {
        return executeScanPipeline({
            projectRoot: this.projectRoot,
            baseURL: this.baseURL,
            version: this.version,
            interner: this.interner
        });
    }
}
