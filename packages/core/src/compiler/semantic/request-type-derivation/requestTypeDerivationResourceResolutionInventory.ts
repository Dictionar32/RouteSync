/** Records resource resolution against canonical route occurrence identity. */
import type {
  RequestTypeRouteResourceResolutionInventoryInterface,
  RequestTypeRouteEvidenceReference,
  RequestTypeDerivationInput,
  RequestTypeRouteResourceResolutionInventoryInput,
  RequestTypeRouteResourceResolutionReceipt,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSourceEvidenceInventory } from './requestTypeDerivationSourceEvidenceInventory';
import { requestTypeDerivationResourceResolution } from './requestTypeDerivationResourceResolution';

const routeEvidenceFor = (
  route: RequestTypeDerivationInput['routes'][number],
  inventory: readonly RequestTypeRouteEvidenceReference[],
): RequestTypeRouteEvidenceReference => {
  const occurrenceKey = requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(route.provenance);
  const matches = inventory.filter(evidence => evidence.occurrenceKey === occurrenceKey);
  switch (matches.length) {
    case 1:
      return matches[0];
    case 0:
      throw new Error(`Missing route evidence for source occurrence ${occurrenceKey}`);
    default:
      throw new Error(`Ambiguous route evidence for source occurrence ${occurrenceKey}`);
  }
};

export const requestTypeDerivationResourceResolutionInventory: RequestTypeRouteResourceResolutionInventoryInterface = Object.freeze({
  resolve: (input: RequestTypeRouteResourceResolutionInventoryInput): readonly RequestTypeRouteResourceResolutionReceipt[] => {
    const { routes, inventory } = input;
    return Object.freeze(routes.map((route: RequestTypeDerivationInput['routes'][number]) => {
    const routeEvidence = routeEvidenceFor(route, inventory.routes);
    const requestBinding = route.binding.request;
    if (requestBinding.kind !== 'form_request') {
      return Object.freeze({
        route: routeEvidence,
        resourceName: route.identity.domain.resource,
        resolution: Object.freeze({ kind: 'not_required' as const }),
      });
    }
    const routeResourceIdentity = requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(route.identity.domain.resource);
    const bindingResourceIdentity = requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(requestBinding.identity.resource);
    if (requestTypeDerivationSourceEvidenceInventory.relateCanonicalResourceIdentity(routeResourceIdentity, bindingResourceIdentity).kind === 'canonical_resource_identity_distinct') {
      return Object.freeze({
        route: routeEvidence,
        resourceName: requestBinding.identity.resource,
        resolution: Object.freeze({
          kind: 'identity_mismatch' as const,
          routeResourceName: route.identity.domain.resource,
          bindingResourceName: requestBinding.identity.resource,
        }),
      });
    }
    return Object.freeze({
      route: routeEvidence,
      resourceName: requestBinding.identity.resource,
      resolution: requestTypeDerivationResourceResolution.resolve({
        resourceName: requestBinding.identity.resource,
        resources: inventory.resources,
      }),
    });
    }));
  },
});
