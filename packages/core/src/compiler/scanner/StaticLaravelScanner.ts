/**
 * StaticLaravelScanner.ts
 *
 * Slim Orchestrator & Backward-Compatible Facade for Laravel Project Scanning.
 * Coordinates specialized sub-scanners and re-exports all AST descriptors.
 * Active Consumer: Orchestrates Laravel project scanning pipeline.
 *
 * @module core/compiler/scanner
 */

import type {
    RouteManifest,
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ResourceRouteGroup,
    BroadcastChannelDescriptor,
    RouteParameter,
    ParsedColumn
} from "../../types/route";
import type { RequestType } from "../artifacts/RequestTypesArtifact";
import type { ObjectType } from "../types/SemanticType";
import { TypeInterner } from "../types/TypeInterner";

// Re-export AST Descriptors explicitly (Rule 14: Zero wildcard re-exports)
export {
    LaravelValidationType,
    type LaravelValidationConstraint,
    type ResourceExpressionDescriptor,
    type StaticLaravelScannerOptions,
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams,
    ScannedRouteSchemaPayload,
    type ScannedRouteSchemaParams,
    ScannedScalarFieldNode,
    type ScannedScalarFieldParams,
    ScannedObjectFieldNode,
    type ScannedObjectFieldParams,
    ScannedArrayFieldNode,
    type ScannedArrayFieldParams,
    ValidationTreeBuilder,
    buildValidationTree,
    ScannedRouteDescriptor,
    ScannedRouteParameterDescriptor,
    ScannedRouteQueryParameterDescriptor,
    ScannedRoutePolicyDescriptor,
    ScannedRateLimitDescriptor,
    ScannedHttpErrorResponseDescriptor,
    type ScannedRouteCompleteContracts,
    type ScannedRouteConstructorInput,
    type ScannedRouteParams,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams,
    type ScannedRoutePolicyParams,
    type ScannedRateLimitParams,
    type ScannedHttpErrorResponseParams,
    ScannedResourceFieldDescriptor,
    type ScannedResourceFieldParams,
    ScannedResourceDescriptor,
    type ScannedResourceParams,
    ScannedModelColumnDescriptor,
    ScannedModelCastDescriptor,
    ScannedModelRelationDescriptor,
    ScannedModelAccessorDescriptor,
    ScannedModelDescriptor,
    type ScannedModelColumnParams,
    type ScannedModelCastParams,
    type ScannedModelRelationParams,
    type ScannedModelAccessorParams,
    type ScannedModelParams,
    ScannedBroadcastChannelDescriptor,
    type ScannedBroadcastChannelParams,
    compileBroadcastRuntimePattern,
    ScannedFormFieldDescriptor,
    type ScannedFormFieldParams,
    ScannedFormActionDescriptor,
    type ScannedFormActionParams,
    ScannedControllerActionDescriptor,
    type ScannedControllerActionParams,
    ScannedRequestTypeDescriptor,
    type ScannedRequestTypeParams,
    type ControllerActionInfo,
    buildRequestTypeWithActions,
    ScannedResourceRouteGroupDescriptor,
    type ScannedResourceRouteGroupParams,
    ScannedRouteManifestDescriptor,
    type ScannedRouteManifestParams
} from "./descriptors";

// Re-export Subscanners and Utilities explicitly (Rule 14: Zero wildcard re-exports)
export {
    collectPhpFiles,
    ChannelScanner,
    ControllerScanner,
    ResourceScanner,
    FormRequestScanner,
    ModelScanner,
    RouteScanner,
    InvalidationResolver,
    resolvePrimitiveKind,
    resolveRouteDomain,
    ValidationRuleFieldLowerer,
    RequestTypeDeriver,
    deriveRequestTypes,
    SemanticTypeDeriver,
    TypeDeriver
} from "./subscanners";

import type { StaticLaravelScannerOptions } from "./descriptors";
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
import { ModelSymbolTable } from "./symbols/ModelSymbolTable";
import { executeScanPipeline } from "./orchestrator/index";

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
        return executeScanPipeline({
            projectRoot: this.projectRoot,
            baseURL: this.baseURL,
            version: this.version,
            interner: this.interner
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

    private async scanResources(modelSymbolTable?: ModelSymbolTable): Promise<readonly ParsedResource[]> {
        return ResourceScanner.scan(this.projectRoot, modelSymbolTable);
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
