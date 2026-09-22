/**
 * routeEmitter.ts
 *
 * Emits canonical ParsedRoute objects for apiResource and standard routes.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

import type { ActionName, ControllerName, PropertyName, ResourceName, SourceFile } from "../../../../types/upstream/names";

import {
    ParsedRoute,
    HttpMethod,
    HTTP_METHOD_REGISTRY,
    RouteActionKind,
    ResponseDescriptor
} from "../../../../types/route";
import { ControllerActionInfo } from "../../descriptors/requestDescriptors";
import { ScannedRouteDescriptor } from "../../descriptors/routeDescriptors";
import { resolveRoutePath, type ResolvedRoutePath } from "./routePathParser";
import { createActionName } from "../../../../types/upstream/names";

export function mapMethodDetails(method: HttpMethod): {
    method: HttpMethod;
    actionKind: RouteActionKind;
    isMutating: boolean;
} {
    const spec = HTTP_METHOD_REGISTRY[method];
    return { method: spec.method, actionKind: spec.actionKind, isMutating: spec.isMutating };
}

export function emitApiResourceRoutes(
    resolvedBasePath: ResolvedRoutePath,
    resourceName: ResourceName,
    controllerName: ControllerName | undefined,
    controllerMap: Map<string, Map<string, ControllerActionInfo>>,
    resolvedResponse: ResponseDescriptor,
    isAuth: boolean,
    currentMiddlewares: readonly PropertyName[],
    routesFile: SourceFile
): readonly ParsedRoute[] {
    const routes: ParsedRoute[] = [];
    const resourceActions = [
        { method: 'GET' as const, suffix: '', actionName: 'index' },
        { method: 'POST' as const, suffix: '', actionName: 'store' },
        { method: 'GET' as const, suffix: '/{id}', actionName: 'show' },
        { method: 'PUT' as const, suffix: '/{id}', actionName: 'update' },
        { method: 'DELETE' as const, suffix: '/{id}', actionName: 'destroy' }
    ];

    for (const resAction of resourceActions) {
        const path = resolveRoutePath(`${resolvedBasePath.path}${resAction.suffix}`, []);
        const action = controllerName ? controllerMap.get(controllerName.value.value)?.get(resAction.actionName) : undefined;
        if (action) {
            routes.push(ScannedRouteDescriptor.fromControllerAction({
                method: resAction.method,
                path: path.path,
                resourceName,
                action,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: path.parameters
            }));
            continue;
        }
        if (controllerName) {
            routes.push(ScannedRouteDescriptor.fromControllerReference({
                method: resAction.method,
                path: path.path,
                resourceName: createResourceName(resourceName),
                actionName: createActionName(resAction.actionName),
                controllerName,
                auth: isAuth,
                middleware: currentMiddlewares,
                response: resolvedResponse,
                sourceFile: routesFile,
                parameters: path.parameters
            }));
            continue;
        }
        routes.push(ScannedRouteDescriptor.fromClosure({
            method: resAction.method,
            path: path.path,
            resourceName,
            actionName: createActionName(resAction.actionName),
            sourceFile: routesFile,
            response: resolvedResponse,
            auth: isAuth,
            middleware: currentMiddlewares,
            parameters: path.parameters
        }));
    }

    return routes;
}

export type StandardRouteTarget =
    | { readonly kind: "controller_action"; readonly action: ControllerActionInfo }
    | { readonly kind: "controller_reference"; readonly controllerName: import("../../../../types/upstream/names").ControllerName; readonly actionName: import("../../../../types/upstream/names").ActionName; readonly response: ResponseDescriptor }
    | { readonly kind: "closure"; readonly actionName: ActionName; readonly response: ResponseDescriptor };

export function emitStandardRoutes(
    targetMethods: readonly HttpMethod[],
    resolvedPath: ResolvedRoutePath,
    resourceName: ResourceName,
    target: StandardRouteTarget,
    isAuth: boolean,
    currentMiddlewares: readonly PropertyName[],
    routesFile: SourceFile
): readonly ParsedRoute[] {
    const routes: ParsedRoute[] = [];

    for (const method of targetMethods) {
        const { method: canonicalMethod } = mapMethodDetails(method);
        if (target.kind === "controller_action") {
            routes.push(ScannedRouteDescriptor.fromControllerAction({
                method: canonicalMethod,
                path: resolvedPath.path,
                resourceName,
                action: target.action,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: resolvedPath.parameters
            }));
            continue;
        }

        if (target.kind === "controller_reference") {
            routes.push(ScannedRouteDescriptor.fromControllerReference({
                method: canonicalMethod,
                path: resolvedPath.path,
                resourceName: createResourceName(resourceName),
                actionName: target.actionName,
                controllerName: target.controllerName,
                sourceFile: createSourceFile(routesFile),
                response: target.response,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: resolvedPath.parameters
            }));
            continue;
        }

        routes.push(ScannedRouteDescriptor.fromClosure({
            method: canonicalMethod,
            path: resolvedPath.path.value.value,
            resourceName,
            actionName: target.actionName,
            sourceFile: routesFile,
            response: target.response,
            auth: isAuth,
            middleware: currentMiddlewares,
            parameters: resolvedPath.parameters
        }));
    }

    return routes;
}
