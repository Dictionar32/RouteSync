/**
 * routeMutations.ts
 *
 * Immutable semantic relation projections for route descriptors.
 */

import { ScannedEndpointContract, type RouteCacheInvalidation, type RouteCapabilityContract } from "../../../../types/route";
import type { RouteCacheInvalidationDescriptor } from "../../../../types/domain/cacheInvalidation";
import type { Sequence } from "../../../../types/upstream/collections";
import { relationFoldRight } from "../../../../semantic/kernel/relationalSequence";

const emptySequence = <T>(): Sequence<T> => ({ kind: 'empty' });

const sequenceFromArray = <T>(items: readonly T[]): Sequence<T> =>
    relationFoldRight(items, emptySequence<T>(), (head, tail) => ({ kind: 'cons', head, tail }));

const canonicalInvalidation = (descriptor: RouteCacheInvalidationDescriptor): RouteCacheInvalidation => Object.freeze({
    targets: sequenceFromArray(descriptor.targets),
    queryKeyExpressions: sequenceFromArray(descriptor.queryKeyExpressions),
});
import type { RouteSemanticFlowFactory } from "./RouteSemanticFlowFactory";
import type { RouteSemanticFlowConstructorInput } from "./routeContracts";
import type { RouteSemanticFlowFields } from "./routeDeclarations";

type RouteSemanticFlowCreator = (params: RouteSemanticFlowConstructorInput) => RouteSemanticFlowFactory;

export function withRouteInvalidation(
    route: RouteSemanticFlowFields,
    invalidation: RouteCacheInvalidationDescriptor,
    create: RouteSemanticFlowCreator
): RouteSemanticFlowFactory {
    const updatedCapability: RouteCapabilityContract = Object.freeze({
        ...route.capability,
        invalidation: canonicalInvalidation(invalidation)
    });
    const updatedContract = ScannedEndpointContract.fromSubcontracts({
        identity: route.identity,
        binding: route.binding,
        capability: updatedCapability,
        provenance: route.provenance
    });
    return create({
        identity: route.identity,
        binding: route.binding,
        capability: updatedCapability,
        provenance: route.provenance,
        contract: updatedContract
    });
}

export function* projectRouteToHookSource(
    route: RouteSemanticFlowFields
): Iterable<string> {
    yield `// Hook for ${route.identity.coordinates.name} (${route.identity.coordinates.method} ${route.identity.coordinates.path})`;
    yield `// Group: ${route.identity.domain.group}, Role: ${route.capability.crudRole}, Kind: ${route.capability.hookKind}`;
}
