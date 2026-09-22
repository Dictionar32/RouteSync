/**
 * routeMutations.ts
 *
 * Immutable operations and stream projections for ScannedRouteDescriptor.
 * Rule 10 & 14 Compliant: 0 '?', pure projection and immutable cloning.
 *
 * @module core/compiler/scanner/descriptors/route/routeMutations
 */

import {
    ScannedEndpointContract,
    type RouteCacheInvalidationDescriptor,
    type RouteCapabilityContract
} from "../../../../types/route";
import type { ScannedRouteDescriptor } from "./ScannedRouteDescriptor";
import type { ScannedRouteConstructorInput } from "./routeContracts";

/**
 * Returns a new ScannedRouteDescriptor with updated cache invalidation.
 */
export function withRouteInvalidation(
    route: ScannedRouteDescriptor,
    invalidation: RouteCacheInvalidationDescriptor,
    ctor: new (params: ScannedRouteConstructorInput) => ScannedRouteDescriptor
): ScannedRouteDescriptor {
    const updatedCapability: RouteCapabilityContract = Object.freeze({
        ...route.capability,
        invalidation
    });
    const updatedContract = ScannedEndpointContract.fromSubcontracts({
        identity: route.identity,
        binding: route.binding,
        capability: updatedCapability,
        provenance: route.provenance
    });
    return new ctor({
        identity: route.identity,
        binding: route.binding,
        capability: updatedCapability,
        provenance: route.provenance,
        contract: updatedContract
    });
}

/**
 * Pure generator projecting route metadata to hook commentary lines.
 */
export function* projectRouteToHookSource(
    route: ScannedRouteDescriptor
): Iterable<string> {
    yield `// Hook for ${route.identity.name} (${route.identity.method} ${route.identity.path})`;
    yield `// Group: ${route.identity.groupName}, Role: ${route.capability.crudRole}, Kind: ${route.capability.hookKind}`;
}
