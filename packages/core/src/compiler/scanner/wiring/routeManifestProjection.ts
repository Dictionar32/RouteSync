import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import type { RequestTypeDerivationSemanticPipelineInterface } from '../../../types/upstream/requestTypeDerivationInterface';
import {
  authorityBackedRouteManifestProjectionFactory,
  type AuthorityBackedRouteManifestProjectionResult,
} from './routeManifestProjectionAuthority';

/**
 * The active manifest projection entrypoint requires the upstream semantic
 * pipeline. There is deliberately no default to the legacy RequestType[] solver:
 * until a production producer/verifier composition is supplied, callers must
 * surface that missing composition rather than silently derive unverified types.
 */
export interface RouteManifestProjectionOperationsInterface {
  readonly project: (
    preflight: RouteManifestRequestResolutionPreflight,
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ) => AuthorityBackedRouteManifestProjectionResult;
  readonly create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ) => import('./routeManifestProjectionAuthority').AuthorityBackedRouteManifestProjectionInterface;
}

export const routeManifestProjectionOperations: RouteManifestProjectionOperationsInterface = Object.freeze({
  project: (
    preflight: RouteManifestRequestResolutionPreflight,
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ): AuthorityBackedRouteManifestProjectionResult => {
    const projection = authorityBackedRouteManifestProjectionFactory.create(pipeline);
    return projection.project(preflight);
  },
  create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ): import('./routeManifestProjectionAuthority').AuthorityBackedRouteManifestProjectionInterface =>
    authorityBackedRouteManifestProjectionFactory.create(pipeline),
});
