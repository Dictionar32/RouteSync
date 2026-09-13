/**
 * routeEmitter.ts
 *
 * Emits canonical ParsedRoute objects for apiResource and standard routes.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

import {
    ParsedRoute,
    HttpMethod,
    HTTP_METHOD_REGISTRY,
    RouteActionKind,
    ResponseDescriptor
} from "../../../../types/route";
import { ControllerActionInfo } from "../../descriptors/requestDescriptors";
import { ScannedRouteDescriptor } from "../../descriptors/routeDescriptors";
import { extractPathParams } from "./routePathParser";

export function mapMethodDetails(method: string): {
    method: HttpMethod;
    actionKind: RouteActionKind;
    isMutating: boolean;
} {
    const m = method.toUpperCase() as HttpMethod;
    const spec = HTTP_METHOD_REGISTRY[m] ?? HTTP_METHOD_REGISTRY.GET;
    return { method: spec.method, actionKind: spec.actionKind, isMutating: spec.isMutating };
}

export function emitApiResourceRoutes(
    normalizedPath: string,
    resourceName: string,
    controllerName: string | undefined,
    controllerMap: Map<string, Map<string, ControllerActionInfo>>,
    resolvedResponse: ResponseDescriptor,
    isAuth: boolean,
    currentMiddlewares: readonly string[],
    routesFile: string
): readonly ParsedRoute[] {
    const routes: ParsedRoute[] = [];
    const resourceActions = [
        { method: 'GET' as const, path: normalizedPath, actionName: 'index' },
        { method: 'POST' as const, path: normalizedPath, actionName: 'store' },
        { method: 'GET' as const, path: `${normalizedPath}/{id}`, actionName: 'show' },
        { method: 'PUT' as const, path: `${normalizedPath}/{id}`, actionName: 'update' },
        { method: 'DELETE' as const, path: `${normalizedPath}/{id}`, actionName: 'destroy' }
    ];

    for (const resAction of resourceActions) {
        const action = controllerName ? controllerMap.get(controllerName)?.get(resAction.actionName) : undefined;
        if (action) {
            routes.push(ScannedRouteDescriptor.fromControllerAction({
                method: resAction.method,
                path: resAction.path,
                resourceName,
                action,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: extractPathParams(resAction.path)
            }));
        } else if (controllerName) {
            routes.push(ScannedRouteDescriptor.fromControllerReference({
                method: resAction.method,
                path: resAction.path,
                resourceName,
                actionName: resAction.actionName,
                controllerName,
                auth: isAuth,
                middleware: currentMiddlewares,
                response: resolvedResponse,
                sourceFile: routesFile,
                parameters: extractPathParams(resAction.path)
            }));
        } else {
            routes.push(ScannedRouteDescriptor.fromClosure({
                method: resAction.method,
                path: resAction.path,
                resourceName,
                actionName: resAction.actionName,
                sourceFile: routesFile,
                response: resolvedResponse,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: extractPathParams(resAction.path)
            }));
        }
    }

    return routes;
}

export function emitStandardRoutes(
    targetMethods: readonly string[],
    normalizedPath: string,
    resourceName: string,
    actionName: string | undefined,
    controllerName: string | undefined,
    actionInfo: ControllerActionInfo | undefined,
    resolvedResponse: ResponseDescriptor,
    isAuth: boolean,
    currentMiddlewares: readonly string[],
    routesFile: string
): readonly ParsedRoute[] {
    const routes: ParsedRoute[] = [];

    for (const method of targetMethods) {
        const { method: canonicalMethod, actionKind } = mapMethodDetails(method);
        if (actionInfo) {
            routes.push(ScannedRouteDescriptor.fromControllerAction({
                method: canonicalMethod,
                path: normalizedPath,
                resourceName,
                action: actionInfo,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: extractPathParams(normalizedPath)
            }));
        } else if (controllerName) {
            routes.push(ScannedRouteDescriptor.fromControllerReference({
                method: canonicalMethod,
                path: normalizedPath,
                resourceName,
                actionName: actionName || actionKind,
                controllerName,
                sourceFile: routesFile,
                response: resolvedResponse,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: extractPathParams(normalizedPath)
            }));
        } else {
            routes.push(ScannedRouteDescriptor.fromClosure({
                method: canonicalMethod,
                path: normalizedPath,
                resourceName,
                actionName: actionName || actionKind,
                sourceFile: routesFile,
                response: resolvedResponse,
                auth: isAuth,
                middleware: currentMiddlewares,
                parameters: extractPathParams(normalizedPath)
            }));
        }
    }

    return routes;
}
