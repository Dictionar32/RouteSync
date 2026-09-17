/**
 * pipelineScanner.ts
 *
 * Core execution pipeline for StaticLaravelScanner.
 *
 * @module core/compiler/scanner/orchestrator
 */

import type {
    RouteManifest,
    ParsedRoute,
    ResourceRouteGroup
} from "../../../types/route";
import { ScannedEndpointContract } from "../../../types/route";
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
    const formRequestMap = new Map<string, RequestType>(formRequests.map(r => [r.formTypeName, r]));
    const controllerMap = await ControllerScanner.scan(projectRoot, formRequestMap);
    const controllerDataflow = ControllerScanner.extractResourceDataflow(controllerMap);
    const resources = await ResourceScanner.scan(projectRoot, modelSymbolTable, controllerDataflow);
    const routes = await RouteScanner.scan(projectRoot, formRequests, controllerMap);
    const channels = await ChannelScanner.scan(projectRoot);
    const derivedRequests = TypeDeriver.deriveRequestTypes(routes, resources, interner);
    const requestTypes = formRequests.length > 0 ? formRequests : derivedRequests;
    const semanticTypes = TypeDeriver.deriveSemanticTypes(resources, models, interner, routes);

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

    const resolvedRoutes = InvalidationResolver.resolveRouteInvalidations(routes, models, routeGroups);

    return new ScannedRouteManifestDescriptor({
        version,
        baseURL,
        routes: resolvedRoutes,
        contracts: resolvedRoutes.map(r => r.contract ?? ScannedEndpointContract.fromRoute(r)),
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
