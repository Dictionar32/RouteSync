/**
 * routeDescriptors.ts
 *
 * Pure Consumer Aggregator for Scanned Route Domain Models.
 * Explicitly consumes focused sub-domains with zero wildcard re-exports (0 'export * from').
 *
 * @module core/compiler/scanner/descriptors/routeDescriptors
 */

// 1. Sub-Domain Contracts & Parameterization
export type {
    RouteSemanticFlowCompleteContracts,
    RouteSemanticFlowConstructorInput,
    RouteSemanticFlowParams
} from "./route/routeContracts";

// 2. Sub-Domain Parameters (Path, Query, Header)
export {
    RouteParameterSemanticFactory,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams
} from "./route/routeParameters";

