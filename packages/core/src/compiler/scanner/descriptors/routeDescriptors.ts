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
    ScannedRouteCompleteContracts,
    ScannedRouteConstructorInput,
    ScannedRouteParams
} from "./route/routeContracts";

// 2. Sub-Domain Parameters (Path, Query, Header)
export {
    ScannedRouteParameterDescriptor,
    ScannedRouteQueryParameterDescriptor,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams
} from "./route/routeParameters";

// 3. Sub-Domain Security & Policies
export {
    ScannedRoutePolicyDescriptor,
    ScannedRateLimitDescriptor,
    type ScannedRoutePolicyParams,
    type ScannedRateLimitParams
} from "./route/routeSecurity";

// 4. Sub-Domain Error Responses
export {
    ScannedHttpErrorResponseDescriptor,
    type ScannedHttpErrorResponseParams
} from "./route/routeResponses";

// 5. The Unifying Composite Consumer Model
export {
    ScannedRouteDescriptor
} from "./route/ScannedRouteDescriptor";
