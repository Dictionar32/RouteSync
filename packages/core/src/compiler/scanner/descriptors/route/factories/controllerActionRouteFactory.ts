/**
 * controllerActionRouteFactory.ts
 *
 * Route creation from Controller Actions.
 * Conforms to Level 6/7 Correct-by-Construction: Pure flow, zero any.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import type {
    HttpMethod,
    RouteParameter,
    RouteQueryParameter,
    RouteCacheInvalidationDescriptor
} from "../../../../../types/route";
import type { ControllerActionInfo } from "../../requestDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";
import type { RouteBoundaryOptions } from "../../../resolvers";

export type ControllerActionRouteOptions = {
    readonly method: HttpMethod;
    readonly path: string;
    readonly action: ControllerActionInfo;
    readonly domain?: string;
    readonly resourceName?: string;
    readonly auth?: boolean;
    readonly middleware?: readonly string[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

export function createRouteFromControllerAction(
    createFn: (params: RouteBoundaryOptions) => ScannedRouteDescriptor,
    options: ControllerActionRouteOptions
): ScannedRouteDescriptor {
    const {
        method,
        path,
        domain,
        resourceName,
        action,
        auth = false,
        middleware = [],
        parameters = [],
        pathParameters,
        queryParameters = [],
        invalidation
    } = options;

    return createFn({
        origin: "controller_action",
        method,
        path,
        domain,
        resourceName,
        controllerName: action.controllerName,
        actionName: action.actionName,
        action: action.target,
        handler: action.handler,
        response: action.response,
        sourceFile: action.sourceFile,
        sourceLine: action.sourceLine,
        formRequests: action.formRequests,
        schema: action.schema,
        auth,
        middleware,
        parameters,
        pathParameters,
        queryParameters,
        invalidation,
        errorResponses: action.errorResponses
    });
}
