/**
 * request-deriver/index.ts
 *
 * Explicit named exports for the RequestType derivation sub-domain.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

export { extractRouteDomain, type RouteDomainInfo } from "./domainExtractor";
export { deriveRouteAction, type DerivedActionInfo } from "./actionDeriver";
export {
    deriveActionResponseData,
    extractResourceResponseFields
} from "./responseDeriver";
export {
    createDerivationContext,
    aggregateRequestTypeGroups,
    type DerivationContext
} from "./groupAggregator";
