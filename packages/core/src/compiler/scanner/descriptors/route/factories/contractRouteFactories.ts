/**
 * contractRouteFactories.ts
 *
 * Route creation from Complete Sub-Contracts and RouteBoundaryOptions.
 *
 * @module compiler/scanner/descriptors/route/factories
 */

import {
    type RouteIdentityContract,
    type RouteBindingContract,
    type RouteCapabilityContract,
    type RouteProvenanceContract,
    ScannedEndpointContract
} from "../../../../../types/route";
import { RouteBoundaryAdapter, type RouteBoundaryOptions } from "../../../resolvers";
import type { RouteSemanticFlowCompleteContracts } from "../routeContracts";
import type { RouteSemanticFlowFactory } from "../RouteSemanticFlowFactory";

export type RouteDescriptorConstructor = (params: RouteSemanticFlowCompleteContracts | {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
}) => RouteSemanticFlowFactory;

export function createRouteFromSubcontracts(
    create: RouteDescriptorConstructor,
    subcontracts: {
        readonly identity: RouteIdentityContract;
        readonly binding: RouteBindingContract;
        readonly capability: RouteCapabilityContract;
        readonly provenance: RouteProvenanceContract;
    }
): RouteSemanticFlowFactory {
    const contract = ScannedEndpointContract.fromSubcontracts(subcontracts);
    return create({
        identity: subcontracts.identity,
        binding: subcontracts.binding,
        capability: subcontracts.capability,
        provenance: subcontracts.provenance,
        contract
    });
}

export function createRouteFromSparse(
    create: RouteDescriptorConstructor,
    params: RouteBoundaryOptions
): RouteSemanticFlowFactory {
    const contracts = RouteBoundaryAdapter.toSubcontracts(params);
    return create(contracts);
}
