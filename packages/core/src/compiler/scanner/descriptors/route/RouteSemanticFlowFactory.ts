/**
 * RouteSemanticFlowFactory.ts
 *
 * Declarative route semantic witness catalog. The exported value is a frozen
 * relation-oriented constructor catalog; route instances are structural data,
 * never class instances.
 */

import { relationGate } from "../../../../semantic/kernel/relationalSequence";
import type {
    RouteCacheInvalidationDescriptor,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";
import type { RouteBoundaryOptions } from "../../resolvers";
import type { RouteSemanticFlowCompleteContracts, RouteSemanticFlowConstructorInput } from "./routeContracts";
import { createRouteSemanticFlowFields, type RouteSemanticFlowFields } from "./routeDeclarations";
import { withRouteInvalidation, projectRouteToHookSource } from "./routeMutations";
import { resolveRouteDescriptorDomain, resolveRouteDescriptorSecurity } from "./routeMethods";
import {
    createRouteFromSubcontracts,
    createRouteFromSparse,
    createRouteFromControllerAction,
    createRouteFromClosure,
    createRouteFromControllerReference,
    createSyntheticRoute
} from "./routeSemanticFactories";

export type RouteSubcontracts = {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
};

export type RouteSemanticFlowFactory = RouteSemanticFlowFields & {
    readonly projectToHookSource: () => Iterable<string>;
    readonly withInvalidation: (invalidation: RouteCacheInvalidationDescriptor) => RouteSemanticFlowFactory;
};

const isCompleteRouteContracts = (
    params: RouteSemanticFlowCompleteContracts | RouteSubcontracts
): params is RouteSemanticFlowCompleteContracts => "contract" in params;

const projectRoute = (params: RouteSemanticFlowConstructorInput): RouteSemanticFlowFactory => Object.freeze({
    ...createRouteSemanticFlowFields(params),
    projectToHookSource: function* () {
        yield* projectRouteToHookSource(createRouteSemanticFlowFields(params));
    },
    withInvalidation: invalidation => withRouteInvalidation(createRouteSemanticFlowFields(params), invalidation, createRouteSemanticFlow)
});

export const createRouteSemanticFlow = (
    params: RouteSemanticFlowCompleteContracts | RouteSubcontracts
): RouteSemanticFlowFactory => relationGate(
    isCompleteRouteContracts(params),
    () => projectRoute(params),
    () => createRouteFromSubcontracts(createRouteSemanticFlow, params)
);

export const RouteSemanticFlowFactory = Object.freeze({
    resolveDomain: resolveRouteDescriptorDomain,
    resolveSecurityAndPolicies: resolveRouteDescriptorSecurity,
    create: createRouteSemanticFlow,
    fromSparse: (params: RouteBoundaryOptions) => createRouteFromSparse(createRouteSemanticFlow, params),
    fromContracts: (contracts: RouteSemanticFlowCompleteContracts) => createRouteSemanticFlow(contracts),
    fromSubcontracts: (subcontracts: RouteSubcontracts) => createRouteFromSubcontracts(createRouteSemanticFlow, subcontracts),
    fromControllerAction: (params: Parameters<typeof createRouteFromControllerAction>[1]) =>
        createRouteFromControllerAction(RouteSemanticFlowFactory.fromSparse, params),
    fromClosure: (params: Parameters<typeof createRouteFromClosure>[1]) =>
        createRouteFromClosure(RouteSemanticFlowFactory.fromSparse, params),
    fromControllerReference: (params: Parameters<typeof createRouteFromControllerReference>[1]) =>
        createRouteFromControllerReference(RouteSemanticFlowFactory.fromSparse, params),
    synthetic: (params?: Parameters<typeof createSyntheticRoute>[1]) =>
        createSyntheticRoute(RouteSemanticFlowFactory.fromSparse, params)
});
