import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type {
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeEvidenceReference,
} from '../../../types/upstream/requestTypeDerivationInterface';
import type { RouteManifest } from './routeManifestInterface';
import { routeManifestProjectionCompositionFactory } from './routeManifestProjectionComposition';
import type { RouteManifestProjectionCompositionResult } from './routeManifestProjectionComposition';

/**
 * Result of the authority-backed integrated-manifest operation.
 * A RouteManifest is materialized only after the upstream runtime executor has
 * accepted a closed, verified RequestType judgment. Non-projectable outcomes
 * remain explicit data and can never be replaced by the legacy solver here.
 */
export type IntegratedRouteManifestAuthorityResult =
  | Readonly<{
      kind: 'integrated_manifest';
      manifest: RouteManifest;
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      derivation: Extract<RouteManifestProjectionCompositionResult, { kind: 'manifest_projected' }>['derivation'];
    }>
  | Readonly<{
      kind: 'manifest_derivation_blocked';
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      derivation: Extract<RouteManifestProjectionCompositionResult, { kind: 'manifest_projection_blocked' }>['derivation'];
    }>;

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
export const createIntegratedRouteManifestAuthority = (
  pipeline: RequestTypeDerivationSemanticPipelineInterface,
): IntegratedRouteManifestAuthorityInterface => {
  const composition = routeManifestProjectionCompositionFactory.create(pipeline);

  return Object.freeze({
    integrate: (manifest: RouteSyncManifest, baseURL: string, version: string): IntegratedRouteManifestAuthorityResult => {
      const result = composition.project(manifest, baseURL, version);
      switch (result.kind) {
        case 'manifest_projected':
          return Object.freeze({
            kind: 'integrated_manifest',
            manifest: result.manifest,
            sourceEvidence: result.sourceEvidence,
            derivation: result.derivation,
          });
        case 'manifest_projection_blocked':
          return Object.freeze({
            kind: 'manifest_derivation_blocked',
            sourceEvidence: result.sourceEvidence,
            derivation: result.derivation,
          });
        default: {
          const exhaustive: never = result;
          return exhaustive;
        }
      }
    },
  });
};
