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
import type { DomainTypeName, ResourceName, RoutePath, PropertyName } from "../../../../../types/upstream/names";
import type { RouteRequestBinding } from "../../../../../types/domain/request";

export type ControllerActionRouteOptions = {
    readonly method: HttpMethod;
    readonly path: RoutePath;
    readonly action: ControllerActionInfo;
    readonly domain?: DomainTypeName;
    readonly resourceName: ResourceName;
    readonly auth?: boolean;
    readonly middleware?: readonly PropertyName[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

function bindControllerRequest(
    request: import('../../request/controllerActionContract').ControllerRequestBinding,
    resourceName: ResourceName
): RouteRequestBinding {
    switch (request.kind) {
        case 'form_request':
            return {
                kind: 'form_request',
                identity: { source: request.source.identity, resource: resourceName },
                source: request.source
            };
        case 'framework_request':
            return { kind: 'framework_request', type: request.type };
        case 'no_request':
            return { kind: 'no_request' };
        case 'typed':
            return { kind: 'no_request' };
    }
}

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
        action: action.actionName,
        handler: action.handler,
        response: action.response,
        sourceFile: action.sourceFile,
        sourceLine: action.sourceLine,
        request: bindControllerRequest(action.request, resourceName),
        runtimeReturn: action.runtimeReturn,
        semanticReturn: action.semanticReturn,
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
