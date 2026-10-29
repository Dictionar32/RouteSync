import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import type { RequestTypeDerivationSemanticPipelineInterface } from '../../../types/upstream/requestTypeDerivationInterface';
import { authorityBackedRouteManifestTypeLoweringFactory } from './routeManifestTypeLoweringAuthority';
import type { AuthorityBackedRouteManifestTypeLoweringResult } from './routeManifestTypeLoweringAuthority';

/**
 * Projection preserves the lowering authority's closed ADT unchanged.
 * The former `lowered | derivation_not_projectable` -> `projected | not_projectable`
 * conversion carried no new evidence or domain decision, so it duplicated the
 * same outcome boundary and forced another exhaustive switch.
 */
export type AuthorityBackedRouteManifestProjectionResult = AuthorityBackedRouteManifestTypeLoweringResult;

export interface AuthorityBackedRouteManifestProjectionInterface {
  readonly project: (preflight: RouteManifestRequestResolutionPreflight) => AuthorityBackedRouteManifestProjectionResult;
}

/**
 * Interface-first composition root for consumers that require proof-backed
 * RequestType semantics. The authority is injected; this module does not build
 * semantic judgments or reinterpret source evidence.
 */
export interface AuthorityBackedRouteManifestProjectionFactoryInterface {
  readonly create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ) => AuthorityBackedRouteManifestProjectionInterface;
}

export const authorityBackedRouteManifestProjectionFactory: AuthorityBackedRouteManifestProjectionFactoryInterface = Object.freeze({
  create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ): AuthorityBackedRouteManifestProjectionInterface => {
  const lowering = authorityBackedRouteManifestTypeLoweringFactory.create(pipeline);

  return Object.freeze({
    project: (preflight: RouteManifestRequestResolutionPreflight): AuthorityBackedRouteManifestProjectionResult =>
      lowering.project(preflight),
  });
  },
});
