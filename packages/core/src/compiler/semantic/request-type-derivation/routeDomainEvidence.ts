/**
 * Canonical route-domain evidence.
 *
 * This operation preserves the semantic value objects already carried by the
 * route identity. It deliberately does not flatten resource/domain/group into
 * primitive strings or duplicate the resource value as a supposed "bare"
 * domain. Classification is owned by the route identity producer.
 */
import type { RouteSemanticFlow } from '../../../types/domain/routes';
import type { DomainName, ResourceName } from '../../../types/domain/semanticValues';

export interface RouteDomainEvidence {
  readonly resource: ResourceName;
  readonly domain: DomainName;
  readonly group: DomainName;
}

export interface RouteDomainEvidenceExtractionInterface {
  readonly extract: (route: RouteSemanticFlow) => RouteDomainEvidence;
}

export const routeDomainEvidenceExtraction: RouteDomainEvidenceExtractionInterface = Object.freeze({
  extract: (route: RouteSemanticFlow): RouteDomainEvidence => Object.freeze({
    resource: route.identity.domain.resource,
    domain: route.identity.domain.domain,
    group: route.identity.domain.group,
  }),
});
