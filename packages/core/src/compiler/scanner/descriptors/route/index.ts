/**
 * index.ts
 *
 * Re-exports all Scanned Route Sub-Domain Descriptors and the Unifying ScannedRouteDescriptor.
 *
 * @module core/compiler/scanner/descriptors/route
 */

// 1. Sub-Domain Contracts & Parameterization
export type {
    ScannedRouteCompleteContracts,
    ScannedRouteConstructorInput,
    ScannedRouteParams
} from "./routeContracts";

// 2. Sub-Domain Parameters (Path, Query, Header)
export {
    ScannedRouteParameterDescriptor,
    ScannedRouteQueryParameterDescriptor,
    type ScannedRouteParameterParams,
    type ScannedRouteQueryParameterParams
} from "./routeParameters";

// 3. Sub-Domain Security & Policies
export {
    ScannedRoutePolicyDescriptor,
    ScannedRateLimitDescriptor,
    type ScannedRoutePolicyParams,
    type ScannedRateLimitParams
} from "./routeSecurity";

// 4. Sub-Domain Error Responses
export {
    ScannedHttpErrorResponseDescriptor,
    type ScannedHttpErrorResponseParams
} from "./routeResponses";

// 5. The Unifying Composite Consumer Model
export {
    ScannedRouteDescriptor
} from "./ScannedRouteDescriptor";

