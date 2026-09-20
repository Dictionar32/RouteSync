/**
 * pipelineScanner.ts
 *
 * Core execution pipeline for StaticLaravelScanner.
 *
 * @module core/compiler/scanner/orchestrator
 */

import type {
    RouteManifest
} from "../../../types/route";
import type { RequestType } from "../../artifacts/RequestTypesArtifact";
import type { TypeInterner } from "../../types/TypeInterner";
import {
    ScannedResourceRouteGroupDescriptor,
    ScannedRouteManifestDescriptor
} from "../descriptors";
import {
    ChannelScanner,
    ResourceScanner,
    FormRequestScanner,
    ModelScanner,
    RouteScanner,
    ControllerScanner,
    InvalidationResolver,
    TypeDeriver
} from "../subscanners";
import { ModelSymbolTable } from "../symbols/ModelSymbolTable";

export async function executeScanPipeline({
    projectRoot,
    baseURL,
    version,
    interner
}: {
    readonly projectRoot: string;
    readonly baseURL: string;
    readonly version: string;
    readonly interner: TypeInterner;
}): Promise<RouteManifest> {
    const models = await ModelScanner.scan(projectRoot);
    const modelSymbolTable = new ModelSymbolTable(models);
    const formRequests = await FormRequestScanner.scan(projectRoot, interner);
    const formRequestMap = new Map(formRequests.map(r => [r.identity.requestClass.value.value, r] as const));
    const controllerMap = await ControllerScanner.scan(projectRoot, formRequestMap);
    const controllerDataflow = ControllerScanner.extractResourceDataflow(controllerMap);
    const resources = await ResourceScanner.scan(projectRoot, modelSymbolTable, controllerDataflow);
    const routes = await RouteScanner.scan(projectRoot, formRequests, controllerMap);
    const channels = await ChannelScanner.scan(projectRoot);
    const derivedRequests = TypeDeriver.deriveRequestTypes(routes, resources, interner);
    const requestTypes = derivedRequests;
    const semanticTypes = TypeDeriver.deriveSemanticTypes(resources, models, interner, routes);

    const routeGroups = ScannedResourceRouteGroupDescriptor.createMany({
        routes,
        resources,
        models
    });

    const resolvedRoutes = InvalidationResolver.resolveRouteInvalidations(routes, models, routeGroups);

    return new ScannedRouteManifestDescriptor({
        version,
        baseURL,
        routes: resolvedRoutes,
        resources,
        models,
        routeGroups,
        requestTypes,
        semanticTypes,
        generatedAt: new Date().toISOString(),
        channels,
        frontend: { kind: 'disabled' },
        pages: []
    });
}
