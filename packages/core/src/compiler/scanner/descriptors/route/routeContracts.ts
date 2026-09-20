/**
 * routeContracts.ts
 *
 * Closed Route Sub-Contracts for Complete Constructor Parameterization.
 *
 * @module core/compiler/scanner/descriptors/route/routeContracts
 */

import {
    EndpointContract,
    RouteIdentityContract,
    RouteBindingContract,
    RouteCapabilityContract,
    RouteProvenanceContract
} from "../../../../types/route";

export interface ScannedRouteCompleteContracts {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
    readonly contract: EndpointContract;
}

export type ScannedRouteConstructorInput = ScannedRouteCompleteContracts;

/**
 * Canonical constructor input for a scanned route.
 *
 * Route scanning must consume the high-level semantic route contracts rather
 * than maintaining a second flat vocabulary of route fields.
 */
export type ScannedRouteParams = ScannedRouteCompleteContracts;
