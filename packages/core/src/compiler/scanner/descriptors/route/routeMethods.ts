/**
 * routeMethods.ts
 *
 * Direct static delegation methods for ScannedRouteDescriptor.
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
    RoutePolicyDescriptor,
    RateLimitDescriptor
} from "../../../../types/route";
import type { PropertyName, DomainTypeName, ResourceName, ControllerName, RoutePath, ActionName } from "../../../../types/upstream/names";

export function resolveRouteDescriptorDomain(route: {
    readonly domain?: DomainTypeName;
    readonly resourceName?: ResourceName;
    readonly controllerName?: ControllerName;
    readonly path?: RoutePath;
    readonly actionName?: ActionName;
}): DomainTypeName {
    return RouteDomainResolver.resolve(route);
}

export function resolveRouteDescriptorSecurity(
    middleware: readonly PropertyName[],
    auth: boolean
): {
    readonly security: RouteSecurityDescriptor;
    readonly auth: boolean;
    readonly policies: readonly RoutePolicyDescriptor[];
    readonly rateLimit: RateLimitDescriptor | null;
} {
    return RouteSecurityResolver.resolve(middleware, auth);
}
