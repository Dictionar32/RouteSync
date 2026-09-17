/**
 * syntheticRouteFactory.ts
 *
 * Synthetic route fixture creation.
 * Conforms to Level 6/7 Correct-by-Construction: Pure flow, zero any.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type HttpMethod,
    type RouteParameter,
    type ResponseDescriptor,
    ResourceResponseDescriptor,
    type RouteCacheInvalidationDescriptor,
    ScannedRouteCacheInvalidationDescriptor,
    RouteHandlerKind
} from "../../../../../types/route";
import { ScannedRouteSchemaPayload } from "../../validationDescriptors";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";
import type { RouteBoundaryOptions } from "../../../resolvers";

export type SyntheticRouteOptions = {
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
    readonly sourceFile?: string;
    readonly sourceLine?: number;
};

export function createSyntheticRoute(
    createFn: (params: RouteBoundaryOptions) => ScannedRouteDescriptor,
    options: SyntheticRouteOptions = {}
): ScannedRouteDescriptor {
    const {
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
    } = options;

    return createFn({
        origin: "synthetic",
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
        sourceFile,
        sourceLine,
        response: response ?? new ResourceResponseDescriptor({ resourceName: `${resourceName}Resource`, shape: "single" }),
        formRequests: [],
        schema: ScannedRouteSchemaPayload.empty(),
        auth,
        middleware,
        parameters,
        invalidation: invalidation ?? ScannedRouteCacheInvalidationDescriptor.none()
    });
}
