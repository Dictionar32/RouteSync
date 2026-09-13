/**
 * request-deriver/index.ts
 *
 * Explicit named exports for the RequestType derivation sub-domain.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

export { convertRawToSemanticType } from "./rawTypeConverter";
export { extractRouteDomain, type RouteDomainInfo } from "./domainExtractor";
export { deriveRouteAction, type DerivedActionInfo } from "./actionDeriver";
export {
    deriveActionResponseData,
    deriveFallbackResponseData,
    extractResourceResponseFields
} from "./responseDeriver";
export {
    createDerivationContext,
    aggregateRequestTypeGroups,
    type DerivationContext
} from "./groupAggregator";
