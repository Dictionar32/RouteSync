/**
 * controllerReferenceRouteFactory.ts
 *
 * Route creation from Controller References.
 * Conforms to Level 6/7 Correct-by-Construction: Pure flow, zero any.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type HttpMethod, type RouteParameter, type RouteQueryParameter, type ResponseDescriptor, VoidResponseDescriptor,
    type RouteCacheInvalidationDescriptor, type RouteSchemaPayload
} from "../../../../../types/route";
import { buildRouteHandler } from "../../request/controllerActionTypes";
import { ScannedRouteSchemaPayload } from "../../validationDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";
import type { RouteBoundaryOptions } from "../../../resolvers";
import type { PropertyName } from "../../../../../types/upstream/names";
import type { RouteRequestBinding } from "../../../../../types/domain/request";
import type { ActionName, ControllerName, DomainTypeName, ResourceName, RoutePath, SourceFile } from "../../../../../types/upstream/names";

export type ControllerReferenceRouteOptions = {
    readonly method: HttpMethod;
    readonly path: RoutePath;
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
    readonly domain?: DomainTypeName;
    readonly resourceName?: ResourceName;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
    readonly response?: ResponseDescriptor;
    readonly request?: RouteRequestBinding;
    readonly schema?: RouteSchemaPayload;
    readonly auth?: boolean;
    readonly middleware?: readonly PropertyName[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

export function createRouteFromControllerReference(
    createFn: (params: RouteBoundaryOptions) => ScannedRouteDescriptor,
    options: ControllerReferenceRouteOptions
): ScannedRouteDescriptor {
    const {
        method, path, controllerName, actionName, domain, resourceName,
        sourceFile, sourceLine, response = new VoidResponseDescriptor(), request,
        schema = ScannedRouteSchemaPayload.empty(), auth = false,
        middleware = [], parameters = [], pathParameters, queryParameters = [], invalidation
    } = options;

    const handler = buildRouteHandler(controllerName, actionName);

    return createFn({
        origin: "controller_reference",
        method,
        path,
        domain,
        resourceName,
        controllerName,
        actionName,
        action: actionName,
        handler,
        response,
        sourceFile,
        sourceLine,
        request: request === undefined ? { kind: 'no_request' } : request, runtimeReturn: { kind: 'none' }, schema, auth, middleware, parameters,
        pathParameters, queryParameters, invalidation
    });
}
