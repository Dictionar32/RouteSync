/**
 * request-deriver/index.ts
 *
 * Explicit named exports for the RequestType derivation sub-domain.
 *
 * @module core/compiler/scanner/operations/request-deriver
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
// The former groupAggregator barrel target does not exist in this source tree;
// do not retain a dangling export or manufacture a compatibility replacement.
export { semanticMappingContractDerivation, type SemanticMappingContractDerivationInterface } from '../../../semantic/request-type-derivation/semanticMappingContractDerivation';
