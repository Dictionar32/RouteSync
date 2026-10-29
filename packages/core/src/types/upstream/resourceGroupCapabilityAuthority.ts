import type { RouteSemanticFlow } from '../domain/routes';
import type {
  ResourceGroupCapabilityAlgebraInterface,
  ResourceGroupCapabilityContract,
} from './resourceGroupCapability';
import { resourceGroupCapabilityAlgebra } from './resourceGroupCapabilityAlgebra';

/**
 * Upstream authority boundary for resource-group capability composition.
 * Semantic rules live in the relation algebra; this adapter preserves the
 * established producer API while preventing manifest wiring/generators from
 * owning the classification.
 */
export const resourceGroupCapabilityAuthority: ResourceGroupCapabilityAlgebraInterface = Object.freeze({
  compose: (routes: readonly RouteSemanticFlow[]) => resourceGroupCapabilityAlgebra.compose(routes),
});

export interface ResourceGroupCapabilityAuthorityOperationsInterface {
  readonly fromRoutes: (
    routes: readonly RouteSemanticFlow[],
  ) => readonly ResourceGroupCapabilityContract[];
}

const resourceGroupCapabilitiesFromRoutesImpl = (
  routes: readonly RouteSemanticFlow[],
): readonly ResourceGroupCapabilityContract[] =>
  resourceGroupCapabilityAuthority.compose(routes);

/** Public, fully typed operation object for callers that need a direct route-to-capability projection. */
export const resourceGroupCapabilityAuthorityOperations: ResourceGroupCapabilityAuthorityOperationsInterface = Object.freeze({
  fromRoutes: resourceGroupCapabilitiesFromRoutesImpl,
});
