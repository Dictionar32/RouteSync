import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { RequestTypeDerivationSemanticPipelineInterface } from '../../../types/upstream/requestTypeDerivationInterface';
import { routeManifestProjectionCompositionFactory } from './routeManifestProjectionComposition';
import { routeManifestRequestResolutionPreflight } from './routeManifestRequestResolutionPreflight';
import type { RouteManifestProjectionCompositionResult } from './routeManifestProjectionComposition';

/**
 * Integration exposes the composition ADT unchanged. Renaming its two outcomes
 * to `integrated_manifest | manifest_derivation_blocked` duplicated the same
 * semantic result and discarded the variant-owned continuation operation.
 */
export type IntegratedRouteManifestAuthorityResult = RouteManifestProjectionCompositionResult;

export interface IntegratedRouteManifestAuthorityInterface {
  readonly integrate: (
    manifest: RouteSyncManifest,
    baseURL: string,
    version: string,
  ) => IntegratedRouteManifestAuthorityResult;
}

/**
 * Composition root for the full upstream-authority -> runtime executor ->
 * integrated RouteManifest path. The semantic pipeline is mandatory injection:
 * this operation cannot invent a producer, classify source evidence, or fall
 * back to unverified RequestType[] output.
 */
export interface IntegratedRouteManifestAuthorityFactoryInterface {
  readonly create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ) => IntegratedRouteManifestAuthorityInterface;
}

export const integratedRouteManifestAuthorityFactory: IntegratedRouteManifestAuthorityFactoryInterface = Object.freeze({
  create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ): IntegratedRouteManifestAuthorityInterface => {
  const composition = routeManifestProjectionCompositionFactory.create(pipeline);

  return Object.freeze({
    integrate: (manifest: RouteSyncManifest, baseURL: string, version: string): IntegratedRouteManifestAuthorityResult =>
      composition.project(routeManifestRequestResolutionPreflight.evaluate(manifest), baseURL, version),
  });
  },
});
