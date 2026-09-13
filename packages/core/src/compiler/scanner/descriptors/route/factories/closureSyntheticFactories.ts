/**
 * closureSyntheticFactories.ts
 *
 * Route creation from Closures and Synthetic fixtures.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type HttpMethod,
    type RouteParameter,
    type RouteQueryParameter,
    type ResponseDescriptor,
    ResourceResponseDescriptor,
    type RouteCacheInvalidationDescriptor,
    ScannedRouteCacheInvalidationDescriptor,
    RouteHandlerKind
} from "../../../../../types/route";
import { ScannedRouteSchemaPayload } from "../../validationDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";

export function createRouteFromClosure(
    createFn: (params: any) => ScannedRouteDescriptor,
    {
        method,
        path,
        domain,
        resourceName,
        actionName,
        sourceFile,
        sourceLine = 1,
        response,
        auth = false,
        middleware = [],
        parameters = [],
        pathParameters,
        queryParameters = [],
        invalidation
    }: {
        readonly method: HttpMethod;
        readonly path: string;
        readonly actionName: string;
        readonly sourceFile: string;
        readonly sourceLine?: number;
        readonly response?: ResponseDescriptor;
        readonly domain?: string;
        readonly resourceName?: string;
        readonly auth?: boolean;
        readonly middleware?: readonly string[];
        readonly parameters?: readonly RouteParameter[];
        readonly pathParameters?: readonly RouteParameter[];
        readonly queryParameters?: readonly RouteQueryParameter[];
        readonly invalidation?: RouteCacheInvalidationDescriptor;
    }
): ScannedRouteDescriptor {
    return createFn({
        method,
        path,
        domain,
        resourceName,
        actionName,
        action: `closure@${actionName}`,
        controllerName: "",
        handler: Object.freeze({
            kind: RouteHandlerKind.Closure,
            actionName,
            target: `closure@${actionName}`
        }),
        sourceFile,
        sourceLine,
        response,
        formRequests: [],
        schema: ScannedRouteSchemaPayload.empty(),
        auth,
        middleware,
        parameters,
        pathParameters,
        queryParameters,
        invalidation
    });
}

export function createSyntheticRoute(
    createFn: (params: any) => ScannedRouteDescriptor,
    {
        method = "GET",
        path = "/synthetic",
        domain = "Synthetic",
        resourceName = "Synthetic",
        actionName = "index",
        response,
        auth = false,
        middleware = [],
        parameters = [],
        invalidation
    }: {
        readonly method?: HttpMethod;
        readonly path?: string;
        readonly domain?: string;
        readonly resourceName?: string;
        readonly actionName?: string;
        readonly response?: ResponseDescriptor;
        readonly auth?: boolean;
        readonly middleware?: readonly string[];
        readonly parameters?: readonly RouteParameter[];
        readonly invalidation?: RouteCacheInvalidationDescriptor;
    } = {}
): ScannedRouteDescriptor {
    return createFn({
        method,
        path,
        domain,
        resourceName,
        actionName,
        action: `synthetic@${actionName}`,
        controllerName: "SyntheticController",
        handler: Object.freeze({
            kind: RouteHandlerKind.ControllerAction,
            controllerName: "SyntheticController",
            actionName,
            target: `synthetic@${actionName}`
        }),
        response: response ? response : new ResourceResponseDescriptor({ resourceName: `${resourceName}Resource`, shape: "single" }),
        auth,
        middleware,
        parameters,
        invalidation: invalidation ? invalidation : ScannedRouteCacheInvalidationDescriptor.none()
    });
}
