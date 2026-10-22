/**
 * request-deriver/index.ts
 *
 * Explicit named exports for the RequestType derivation sub-domain.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

export {
    routeDomainEvidenceExtraction,
    type RouteDomainEvidence,
    type RouteDomainEvidenceExtractionInterface,
} from "./domainExtractor";
export { requestTypeRouteActionDerivation, type RequestTypeRouteActionDerivationInterface, type DerivedActionInfo } from "./actionDeriver";
export {
    requestTypeResponseContributionDerivation,
    requestTypeResourceResponseFieldProjection,
    type RequestTypeResponseContributionDerivationInterface,
    type RequestTypeResourceResponseFieldProjectionInterface,
} from "./responseDeriver";
export {
    createDerivationContext,
    aggregateRequestTypeGroups,
    type DerivationContext
} from "./groupAggregator";
export { deriveSemanticMappingContract } from './semanticMappingDeriver';
