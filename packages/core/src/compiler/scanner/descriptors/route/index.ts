/**
 * index.ts
 *
 * Re-exports all Scanned Route Sub-Domain Descriptors and the Unifying RouteSemanticFlowFactory.
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
    ScannedRouteParameterDescriptor,
    ScannedRouteQueryParameterDescriptor,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams
} from "./routeParameters";

// 5. The Unifying Composite Consumer Model
export {
    RouteSemanticFlowFactory
} from "./RouteSemanticFlowFactory";

