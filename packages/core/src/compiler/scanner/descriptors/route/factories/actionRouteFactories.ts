/**
 * actionRouteFactories.ts
 *
 * Route creation from Controller Actions and Controller References.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type HttpMethod,
    type RouteParameter,
    type RouteQueryParameter,
    type ResponseDescriptor,
    type RouteCacheInvalidationDescriptor,
    type RouteHandlerDescriptor,
    type FormRequestDescriptor,
    type RouteSchemaPayload,
    RouteHandlerKind
} from "../../../../../types/route";
import { ScannedRouteSchemaPayload } from "../../validationDescriptors";
import type { ControllerActionInfo } from "../../requestDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";

export function createRouteFromControllerAction(
    createFn: (params: any) => ScannedRouteDescriptor,
    {
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
    }: {
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
    }
): ScannedRouteDescriptor {
    return createFn({
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

export function createRouteFromControllerReference(
    createFn: (params: any) => ScannedRouteDescriptor,
    {
        method,
        path,
        controllerName,
        actionName,
        domain,
        resourceName,
        sourceFile = "",
        sourceLine = 1,
        response,
        formRequests = [],
        schema = ScannedRouteSchemaPayload.empty(),
        auth = false,
        middleware = [],
        parameters = [],
        pathParameters,
        queryParameters = [],
        invalidation
    }: {
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
    }
): ScannedRouteDescriptor {
    const target = `${controllerName}@${actionName}`;
    const handler: RouteHandlerDescriptor = Object.freeze(
        actionName === '__invoke'
            ? {
                kind: RouteHandlerKind.InvokableController,
                controllerName,
                actionName: '__invoke',
                target
            }
            : {
                kind: RouteHandlerKind.ControllerAction,
                controllerName,
                actionName,
                target
            }
    );

    return createFn({
        method,
        path,
        domain,
        resourceName,
        controllerName,
        actionName,
        action: target,
        handler,
        response,
        sourceFile,
        sourceLine,
        formRequests,
        schema,
        auth,
        middleware,
        parameters,
        pathParameters,
        queryParameters,
        invalidation
    });
}
