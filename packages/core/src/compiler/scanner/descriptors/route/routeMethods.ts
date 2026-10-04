/**
 * routeMethods.ts
 *
 * Direct static delegation methods for RouteSemanticFlowFactory.
 * Rule 14 Compliant: Active consumer delegates for domain & security resolution.
 *
 * @module core/compiler/scanner/descriptors/route/routeMethods
 */

import {
    RouteDomainResolver,
    RouteSecurityResolver,
    type RouteBoundaryOptions
} from "../../resolvers";
import type {
    RouteSecurityDescriptor,
    RoutePolicyDescriptor
} from "../../../../types/route";
import type { RouteRateLimit } from "../../../../types/upstream/route";
import type { PropertyName, DomainTypeName, ResourceName, ControllerName, RoutePath, ActionName } from "../../../../types/upstream/names";
import { truthValue } from "../../../../types/upstream/valueObjects";
import type { RouteMiddleware } from "../../../../types/upstream/route";
import type { RouteMiddlewares, Sequence } from "../../../../types/upstream/collections";
import { createMiddlewareName } from "../../../../types/upstream/names";
import { relationFoldRight } from "../../../../semantic/kernel/relationalSequence";

export function resolveRouteDescriptorDomain(route: import("../../resolvers/RouteDomainResolver").RouteDomainResolutionContext): DomainTypeName {
    return RouteDomainResolver.resolve(route);
}

export function resolveRouteDescriptorSecurity(
    middleware: readonly PropertyName[],
    auth: boolean
): import("../../resolvers/RouteSecurityResolver").RouteSecurityResolution {
    const empty: Sequence<RouteMiddleware> = { kind: "empty" };
    const items: Sequence<RouteMiddleware> = relationFoldRight<PropertyName, Sequence<RouteMiddleware>>(middleware, empty, (item, tail) => ({ kind: "cons", head: Object.freeze({ kind: "direct", name: createMiddlewareName(item.value.value) }), tail }));
    return RouteSecurityResolver.resolve(Object.freeze({ kind: "route_middlewares", items }), truthValue(auth));
}
