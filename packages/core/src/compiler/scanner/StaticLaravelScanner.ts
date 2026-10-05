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
    RouteSemanticFlow,
    ResourceRouteGroup
} from "../../types/route";
import type { RequestType } from "../artifacts/RequestTypesArtifact";
import type { ObjectType } from "../types/SemanticType";
import type { ModelAst, ResourceAst, RequestAst } from "../../types/upstream/ast";
import { TypeInterner } from "../types/TypeInterner";
import type { StaticLaravelScannerOptions } from "./descriptors";
import { InvalidationResolver, TypeDeriver } from "./subscanners";
import { scanRouteSyncManifest } from "./orchestrator/index";
import type { ManifestAst, RouteSyncManifest } from "../../types/upstream/manifest";
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

export interface StaticLaravelScanner {
    readonly sourceProject: SourceProjectIdentity;
    readonly baseURL: string;
    readonly version: string;
    readonly interner: TypeInterner;
    readonly executeUpstream: () => Promise<RouteSyncManifest>;
    readonly executeUpstreamAst: () => Promise<ManifestAst>;
}

const createScanner = ({
    sourceProject,
    baseURL = "http://localhost/api",
    version = "6.0.0",
}: {
    readonly sourceProject: SourceProjectIdentity;
    readonly baseURL?: string;
    readonly version?: string;
}): StaticLaravelScanner => {
    const interner = TypeInterner.create();
    let upstreamManifest: Promise<RouteSyncManifest> | undefined;
    const executeUpstream = (): Promise<RouteSyncManifest> => {
        upstreamManifest ??= scanRouteSyncManifest(sourceProject);
        return upstreamManifest;
    };
    const executeUpstreamAst = async (): Promise<ManifestAst> => {
        const manifest = await executeUpstream();
        return Object.freeze({ kind: 'manifest_ast', definition: manifest, source: sourceProject.source });
    };
    return Object.freeze({ sourceProject, baseURL, version, interner, executeUpstream, executeUpstreamAst });
};

export const StaticLaravelScanner = Object.freeze({
    create: createScanner,
    scan: async (
        sourceProject: SourceProjectIdentity,
        options: { readonly baseURL?: string; readonly version?: string } = {},
    ): Promise<RouteSyncManifest> => createScanner({ sourceProject, baseURL: options.baseURL, version: options.version }).executeUpstream(),
    resolveRouteInvalidations: (
        routes: readonly RouteSemanticFlow[],
        models: readonly ModelAst[],
        routeGroups: readonly ResourceRouteGroup[],
    ): readonly RouteSemanticFlow[] => InvalidationResolver.resolveRouteInvalidations(routes, models, routeGroups),
    deriveRequestTypes: (
        routes: readonly RouteSemanticFlow[] = [],
        resources: readonly ResourceAst[] = [],
        requests: readonly RequestAst[] = [],
        interner: TypeInterner = TypeInterner.create(),
    ): readonly RequestType[] => TypeDeriver.deriveRequestTypes(routes, resources, requests, interner),
    deriveSemanticTypes: (
        resources: readonly ResourceAst[] = [],
        models: readonly ModelAst[] = [],
        interner: TypeInterner = TypeInterner.create(),
        routes: readonly RouteSemanticFlow[] = [],
    ): readonly ObjectType[] => TypeDeriver.deriveSemanticTypes(resources, models, interner, routes),
});

