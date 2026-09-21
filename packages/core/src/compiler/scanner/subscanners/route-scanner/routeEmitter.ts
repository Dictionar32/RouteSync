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
import { resolveRoutePath, type ResolvedRoutePath } from "./routePathParser";

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
        { method: 'GET' as const, suffix: '', actionName: 'index' },
        { method: 'POST' as const, suffix: '', actionName: 'store' },
        { method: 'GET' as const, suffix: '/{id}', actionName: 'show' },
        { method: 'PUT' as const, suffix: '/{id}', actionName: 'update' },
        { method: 'DELETE' as const, suffix: '/{id}', actionName: 'destroy' }
    ];

    for (const resAction of resourceActions) {
        const path = resolveRoutePath(`${resolvedBasePath.path}${resAction.suffix}`, []);
        const action = controllerName ? controllerMap.get(controllerName)?.get(resAction.actionName) : undefined;
        if (action) {
            routes.push(ScannedRouteDescriptor.fromControllerAction({
                method: resAction.method,
                path: path.path.value.value,
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
                path: path.path.value.value,
                resourceName,
                actionName: resAction.actionName,
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
            path: path.path.value.value,
            resourceName,
            actionName: resAction.actionName,
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
    | { readonly kind: "controller_reference"; readonly controllerName: string; readonly actionName: string; readonly response: ResponseDescriptor }
    | { readonly kind: "closure"; readonly actionName: string; readonly response: ResponseDescriptor };

export function emitStandardRoutes(
    targetMethods: readonly HttpMethod[],
    resolvedPath: ResolvedRoutePath,
    resourceName: string,
    target: StandardRouteTarget,
    isAuth: boolean,
    currentMiddlewares: readonly string[],
    routesFile: string
): readonly ParsedRoute[] {
    const routes: ParsedRoute[] = [];

    for (const method of targetMethods) {
        const { method: canonicalMethod } = mapMethodDetails(method);
        if (target.kind === "controller_action") {
            routes.push(ScannedRouteDescriptor.fromControllerAction({
                method: canonicalMethod,
                path: resolvedPath.path.value.value,
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
                path: resolvedPath.path.value.value,
                resourceName,
                actionName: target.actionName,
                controllerName: target.controllerName,
                sourceFile: routesFile,
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
