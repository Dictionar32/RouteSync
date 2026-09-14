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

import { ScannedEndpointContract } from "../../../types/route";
import {
    ScannedRouteCompleteContracts,
    ScannedRouteDescriptor
} from "../descriptors/routeDescriptors";
import {
    RouteBoundaryContract,
    RouteBoundaryOptions,
    SparseRouteParams,
    RouteBoundaryContractFactory,
    resolveRouteBoundaryBasics,
    buildRouteIdentityContract,
    buildRouteBindingContract,
    buildRouteCapabilityContract,
    buildRouteProvenanceContract
} from "./boundary";

export type { RouteBoundaryContract, RouteBoundaryOptions, SparseRouteParams };

export class RouteBoundaryAdapter {
    /**
     * Converts a perimeter options bag into 4 Complete Sub-Contracts and an EndpointContract.
     * Pure Flow Declaration (Active Consumer Orchestrator).
     */
    public static toSubcontracts(params: RouteBoundaryOptions): ScannedRouteCompleteContracts {
        const basics = resolveRouteBoundaryBasics(params);
        const identity = buildRouteIdentityContract(params, basics);
        const binding = buildRouteBindingContract(params, basics);
        const capability = buildRouteCapabilityContract(params, basics, identity.parameters.all.length);
        const provenance = buildRouteProvenanceContract(params);

        const contract = ScannedEndpointContract.fromSubcontracts({
            identity,
            binding,
            capability,
            provenance
        });

        return Object.freeze({
            identity,
            binding,
            capability,
            provenance,
            contract
        });
    }

    /**
     * Constructs a full ScannedRouteDescriptor directly from sparse perimeter parameters.
     */
    public static fromSparse(params: RouteBoundaryOptions): ScannedRouteDescriptor {
        const contracts = RouteBoundaryAdapter.toSubcontracts(params);
        return new ScannedRouteDescriptor(contracts);
    }

    /**
     * Constructs a full ScannedRouteDescriptor from a complete non-nullable RouteBoundaryContract.
     */
    public static fromBoundary(contract: RouteBoundaryContract): ScannedRouteDescriptor {
        return RouteBoundaryAdapter.fromSparse(contract);
    }
}
