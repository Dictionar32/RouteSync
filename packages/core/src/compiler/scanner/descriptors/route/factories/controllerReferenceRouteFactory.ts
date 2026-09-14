/**
 * controllerReferenceRouteFactory.ts
 *
 * Route creation from Controller References.
 * Conforms to Level 6/7 Correct-by-Construction: Pure flow, zero any.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type HttpMethod, type RouteParameter, type RouteQueryParameter, type ResponseDescriptor,
    type RouteCacheInvalidationDescriptor, type FormRequestDescriptor, type RouteSchemaPayload
} from "../../../../../types/route";
import { buildRouteHandler } from "../../request/controllerActionTypes";
import { ScannedRouteSchemaPayload } from "../../validationDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";

export type ControllerReferenceRouteOptions = {
    readonly method: HttpMethod;
    readonly path: string;
    readonly controllerName: string;
    readonly actionName: string;
    readonly domain?: string;
    readonly resourceName?: string;
    readonly sourceFile?: string;
    readonly sourceLine?: number;
    readonly response?: ResponseDescriptor;
    readonly formRequests?: readonly (string | FormRequestDescriptor)[];
    readonly schema?: RouteSchemaPayload;
    readonly auth?: boolean;
    readonly middleware?: readonly string[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

export function createRouteFromControllerReference(
    createFn: (params: any) => ScannedRouteDescriptor,
    options: ControllerReferenceRouteOptions
): ScannedRouteDescriptor {
    const {
        method, path, controllerName, actionName, domain, resourceName,
        sourceFile = "", sourceLine = 1, response, formRequests = [],
        schema = ScannedRouteSchemaPayload.empty(), auth = false,
        middleware = [], parameters = [], pathParameters, queryParameters = [], invalidation
    } = options;

    const target = `${controllerName}@${actionName}`;
    const handler = buildRouteHandler(controllerName, actionName, target);

    return createFn({
        method, path, domain, resourceName, controllerName, actionName,
        action: target, handler, response, sourceFile, sourceLine,
        formRequests, schema, auth, middleware, parameters,
        pathParameters, queryParameters, invalidation
    });
}
