/**
 * index.ts
 *
 * Re-exports canonical scanned route sub-domain descriptors.
 *
 * @module core/compiler/scanner/descriptors/route
 */

// 1. Sub-Domain Contracts & Parameterization
export type {
    RouteSemanticFlowCompleteContracts,
    RouteSemanticFlowConstructorInput,
    RouteSemanticFlowParams
} from "./routeContracts";

// 2. Sub-Domain Parameters (Path, Query, Header)
export {
    RouteParameterSemanticFactory,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams
} from "./routeParameters";


