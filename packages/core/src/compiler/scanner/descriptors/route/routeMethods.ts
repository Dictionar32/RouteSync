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
    type SparseRouteParams
} from "../../resolvers";
import type {
    RouteSecurityDescriptor,
    RoutePolicyDescriptor,
    RateLimitDescriptor
} from "../../../../types/route";

export function resolveRouteDescriptorDomain(route: {
    readonly domain?: string;
    readonly resourceName?: string;
    readonly controllerName?: string;
    readonly path?: string;
    readonly actionName?: string;
}): string {
    return RouteDomainResolver.resolve(route);
}

export function resolveRouteDescriptorSecurity(
    middleware: readonly string[],
    auth: boolean
): {
    readonly security: RouteSecurityDescriptor;
    readonly auth: boolean;
    readonly policies: readonly RoutePolicyDescriptor[];
    readonly rateLimit: RateLimitDescriptor | null;
} {
    return RouteSecurityResolver.resolve(middleware, auth);
}
