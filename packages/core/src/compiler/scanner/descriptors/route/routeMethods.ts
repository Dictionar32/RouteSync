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
    RoutePolicyDescriptor,
    RouteRateLimit
} from "../../../../types/route";
import type { PropertyName, DomainTypeName, ResourceName, ControllerName, RoutePath, ActionName } from "../../../../types/upstream/names";
import { truthValue } from "../../../../types/upstream/valueObjects";

export function resolveRouteDescriptorDomain(route: import("../../resolvers/RouteDomainResolver").RouteDomainResolutionContext): DomainTypeName {
    return RouteDomainResolver.resolve(route);
}

export function resolveRouteDescriptorSecurity(
    middleware: readonly PropertyName[],
    auth: boolean
): {
    readonly security: RouteSecurityDescriptor;
    readonly auth: import("../../../../types/upstream/valueObjects").TruthValue;
    readonly policies: readonly RoutePolicyDescriptor[];
    readonly rateLimit: RouteRateLimit;
} {
    return RouteSecurityResolver.resolve(middleware, truthValue(auth));
}
