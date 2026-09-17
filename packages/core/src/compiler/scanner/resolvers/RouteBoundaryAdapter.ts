/**
 * RouteBoundaryAdapter.ts
 *
 * Active Consumer Orchestrator: Transforms sparse legacy parameters bags into
 * 4 Complete Sub-Contracts (RouteIdentityContract, RouteBindingContract,
 * RouteCapabilityContract, RouteProvenanceContract).
 * Pure Flow Declaration: 0 '?', 0 fallback in core domain.
 *
 * @module core/compiler/scanner/resolvers/RouteBoundaryAdapter
 */

import {
    ScannedRouteCompleteContracts,
    ScannedRouteDescriptor
} from "../descriptors/routeDescriptors";
import {
    RouteBoundaryContract,
    RouteBoundaryOptions,
    RouteBoundaryContractFactory
} from "./boundary";

export type { RouteBoundaryContract, RouteBoundaryOptions };

export class RouteBoundaryAdapter {
    /**
     * Converts a perimeter options bag into 4 Complete Sub-Contracts and an EndpointContract.
     * Pure Flow Declaration (Active Consumer Orchestrator).
     */
    public static toSubcontracts(params: RouteBoundaryOptions): ScannedRouteCompleteContracts {
        return RouteBoundaryContractFactory.create(params);
    }

    /**
     * Constructs a full ScannedRouteDescriptor directly from sparse perimeter parameters.
     */
    public static fromSparse(params: RouteBoundaryOptions): ScannedRouteDescriptor {
        const contracts = RouteBoundaryAdapter.toSubcontracts(params);
        return new ScannedRouteDescriptor(contracts);
    }

}
