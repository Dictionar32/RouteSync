/**
 * contractRouteFactories.ts
 *
 * Route creation from Complete Sub-Contracts and SparseRouteParams.
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
import { RouteBoundaryAdapter, type SparseRouteParams } from "../../../resolvers";
import type { ScannedRouteCompleteContracts } from "../routeContracts";
import type { ScannedRouteDescriptor } from "../ScannedRouteDescriptor";

export type RouteDescriptorConstructor = new (params: ScannedRouteCompleteContracts) => ScannedRouteDescriptor;

export function createRouteFromSubcontracts(
    DescriptorClass: RouteDescriptorConstructor,
    subcontracts: {
        readonly identity: RouteIdentityContract;
        readonly binding: RouteBindingContract;
        readonly capability: RouteCapabilityContract;
        readonly provenance: RouteProvenanceContract;
    }
): ScannedRouteDescriptor {
    const contract = ScannedEndpointContract.fromSubcontracts(subcontracts);
    return new DescriptorClass({
        identity: subcontracts.identity,
        binding: subcontracts.binding,
        capability: subcontracts.capability,
        provenance: subcontracts.provenance,
        contract
    });
}

export function createRouteFromSparse(
    DescriptorClass: RouteDescriptorConstructor,
    params: SparseRouteParams
): ScannedRouteDescriptor {
    const contracts = RouteBoundaryAdapter.toSubcontracts(params);
    return new DescriptorClass(contracts);
}
