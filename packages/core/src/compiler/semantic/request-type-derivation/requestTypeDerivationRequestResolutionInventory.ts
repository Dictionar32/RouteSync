/**
 * Records every route's typed request-resolution result without deriving a
 * RequestType or claiming a closed semantic judgment. Missing and ambiguous
 * outcomes remain visible to the active manifest projection.
 */
import type {
  RequestTypeRouteRequestResolutionInventoryInterface,
  RequestTypeRouteRequestResolutionReceipt,
  RequestTypeRouteEvidenceReference,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationSourceEvidenceInventory } from './requestTypeDerivationSourceEvidenceInventory';
import { requestTypeDerivationRequestResolution } from './requestTypeDerivationRequestResolution';

type RequestResolutionInventoryInput = Parameters<RequestTypeRouteRequestResolutionInventoryInterface['resolve']>[0];

const routeEvidenceFor = (
  route: RequestResolutionInventoryInput['routes'][number],
  inventory: RequestResolutionInventoryInput['inventory'],
): RequestTypeRouteEvidenceReference => {
  const occurrenceKey = requestTypeDerivationSourceEvidenceInventory.canonicalRouteOccurrenceKey(route.provenance);
  const evidence = inventory.routes.filter(candidate => candidate.occurrenceKey === occurrenceKey);

  const routeEvidence = evidence[0];

  if (evidence.length !== 1 || routeEvidence === undefined) {
    throw new Error(`Request-resolution inventory must contain exactly one route evidence receipt for source occurrence ${occurrenceKey}; found ${evidence.length}.`);
  }

  return routeEvidence;
};

const requestResolutionInventory: RequestTypeRouteRequestResolutionInventoryInterface = Object.freeze({
  resolve: (input: RequestResolutionInventoryInput): readonly RequestTypeRouteRequestResolutionReceipt[] => {
    const { routes, inventory } = input;

    return Object.freeze(routes.map((route): RequestTypeRouteRequestResolutionReceipt => {
      const routeEvidence = routeEvidenceFor(route, inventory);

      switch (route.binding.request.kind) {
        case 'form_request':
          return Object.freeze({
            route: routeEvidence,
            bindingKind: route.binding.request.kind,
            resolution: requestTypeDerivationRequestResolution.resolve({
              requestClass: route.binding.request.identity.source.requestClass,
              requests: inventory.requests,
            }),
          });
        case 'no_request':
        case 'framework_request':
        case 'typed_request':
          return Object.freeze({
            route: routeEvidence,
            bindingKind: route.binding.request.kind,
            resolution: Object.freeze({ kind: 'not_required' }),
          });
        case 'unresolved_request':
          return Object.freeze({
            route: routeEvidence,
            bindingKind: route.binding.request.kind,
            resolution: Object.freeze({ kind: 'unresolved_binding', reason: 'unresolved_request' }),
          });
        case 'unresolved_action_request':
          return Object.freeze({
            route: routeEvidence,
            bindingKind: route.binding.request.kind,
            resolution: Object.freeze({ kind: 'unresolved_binding', reason: 'unresolved_action_request' }),
          });
        default: {
          const exhaustive: never = route.binding.request;
          return exhaustive;
        }
      }
    }));
  },
});

export { requestResolutionInventory as requestTypeDerivationRequestResolutionInventory };
