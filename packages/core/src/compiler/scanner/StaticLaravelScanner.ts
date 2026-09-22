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
    ParsedRoute,
    ParsedResource,
    ResourceRouteGroup
} from "../../types/route";
import type { RequestType } from "../artifacts/RequestTypesArtifact";
import type { ObjectType } from "../types/SemanticType";
import type { ModelAst } from "../../types/upstream/ast";
import { TypeInterner } from "../types/TypeInterner";
import type { StaticLaravelScannerOptions } from "./descriptors";
import { InvalidationResolver, TypeDeriver } from "./subscanners";
import { scanRouteSyncManifest } from "./orchestrator/index";
import type { RouteSyncManifest } from "../../types/upstream/manifest";
import type { SourceProjectIdentity } from "../../types/upstream/highLevelSourceModel";
import type { SourceSpan } from "../../types/upstream/provenance";
import type { NumberValue, StringValue } from "../../types/upstream/valueObjects";

export * from "./scannerExports";

export const createLaravelSourceProjectIdentity = (sourceRoot: string): SourceProjectIdentity => {
    const stringValue = (value: string): StringValue => ({ kind: "string_value", value });
    const numberValue = (value: number): NumberValue => ({ kind: "number_value", value });
    const source: SourceSpan = {
        kind: "source_span",
        file: { kind: "source_file", value: stringValue(sourceRoot) },
        start: numberValue(1),
        end: numberValue(1),
    };
    return {
        kind: "laravel_project",
        root: source.file,
        source,
    };
};

export class StaticLaravelScanner {
    public readonly sourceProject: SourceProjectIdentity;
    public readonly baseURL: string;
    public readonly version: string;
    protected readonly interner: TypeInterner;

    constructor({
        sourceProject,
        baseURL = "http://localhost/api",
        version = "6.0.0"
    }: {
        readonly sourceProject: SourceProjectIdentity;
        readonly baseURL?: string;
        readonly version?: string;
    }) {
        this.sourceProject = sourceProject;
        this.interner = new TypeInterner();
        this.baseURL = baseURL;
        this.version = version;
        Object.freeze(this);
    }

    public static create(options: {
        readonly sourceProject: SourceProjectIdentity;
        readonly baseURL?: string;
        readonly version?: string;
    }): StaticLaravelScanner {
        return new StaticLaravelScanner(options);
    }

    static async scan(
        sourceProject: SourceProjectIdentity,
        options: { readonly baseURL?: string; readonly version?: string } = {}
    ): Promise<RouteSyncManifest> {
        return StaticLaravelScanner.create({
            sourceProject,
            baseURL: options.baseURL,
            version: options.version
        }).executeUpstream();
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
        interner: TypeInterner = new TypeInterner()
    ): readonly RequestType[] {
        return TypeDeriver.deriveRequestTypes(routes, resources, interner);
    }

    public static deriveSemanticTypes(
        resources: readonly ParsedResource[] = [],
        models: readonly ModelAst[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        return TypeDeriver.deriveSemanticTypes(resources, models, interner, routes);
    }

    /** Canonical upstream scan: source -> AST/ADT -> CompleteSourceAst -> RouteSyncManifest. */
    public async executeUpstream(): Promise<RouteSyncManifest> {
        return scanRouteSyncManifest(this.sourceProject);
    }

}