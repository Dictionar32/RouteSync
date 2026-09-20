/**
 * closureRouteFactory.ts
 *
 * Route creation from Closures.
 * Conforms to Level 6/7 Correct-by-Construction: Pure flow, zero any.
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
    RouteHandlerKind
} from "../../../../../types/route";
import { ScannedRouteSchemaPayload } from "../../validationDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";
import type { RouteBoundaryOptions } from "../../../resolvers";

export type ClosureRouteOptions = {
    readonly method: HttpMethod;
    readonly path: string;
    readonly actionName: string;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly response?: ResponseDescriptor;
    readonly domain?: string;
    readonly resourceName?: string;
    readonly auth?: boolean;
    readonly middleware?: readonly string[];
    readonly parameters?: readonly RouteParameter[];
    readonly pathParameters?: readonly RouteParameter[];
    readonly queryParameters?: readonly RouteQueryParameter[];
    readonly invalidation?: RouteCacheInvalidationDescriptor;
};

export function createRouteFromClosure(
    createFn: (params: RouteBoundaryOptions) => ScannedRouteDescriptor,
    options: ClosureRouteOptions
): ScannedRouteDescriptor {
    const {
        method,
        path,
        domain,
        resourceName,
        actionName,
        sourceFile,
        sourceLine,
        response,
        auth = false,
        middleware = [],
        parameters = [],
        pathParameters,
        queryParameters = [],
        invalidation
    } = options;

    const resolvedResponse = response !== undefined
        ? response
        : new ResourceResponseDescriptor({ resourceName: `${resourceName ?? "Closure"}Resource`, shape: "single" });

    return createFn({
        origin: "closure",
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
        response: resolvedResponse,
        request: { kind: 'no_request' },
        runtimeReturn: { kind: 'none' },
        schema: ScannedRouteSchemaPayload.empty(),
        auth,
        middleware,
        parameters,
        pathParameters,
        queryParameters,
        invalidation
    });
}
