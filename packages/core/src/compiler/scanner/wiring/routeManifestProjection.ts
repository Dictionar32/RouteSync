import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import type { RequestTypeDerivationSemanticPipelineInterface } from '../../../types/upstream/requestTypeDerivationInterface';
import {
  createAuthorityBackedRouteManifestProjection,
  type AuthorityBackedRouteManifestProjectionResult,
} from './routeManifestProjectionAuthority';

/**
 * The active manifest projection entrypoint requires the upstream semantic
 * pipeline. There is deliberately no default to the legacy RequestType[] solver:
 * until a production producer/verifier composition is supplied, callers must
 * surface that missing composition rather than silently derive unverified types.
 */
export const projectRouteSyncManifestForRouteManifest = (
  preflight: RouteManifestRequestResolutionPreflight,
  pipeline: RequestTypeDerivationSemanticPipelineInterface,
): AuthorityBackedRouteManifestProjectionResult => {
  const projection = createAuthorityBackedRouteManifestProjection(pipeline);
  return projection.project(preflight);
};

/**
 * Factory form for composition roots which own the concrete semantic pipeline.
 * This keeps the semantic dependency explicit and makes legacy fallback
 * structurally unavailable on the active projection path.
 */
export const createRouteManifestProjection = (
  pipeline: RequestTypeDerivationSemanticPipelineInterface,
) => createAuthorityBackedRouteManifestProjection(pipeline);
