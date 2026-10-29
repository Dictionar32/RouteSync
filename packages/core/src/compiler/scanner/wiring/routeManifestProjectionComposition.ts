import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import type { RequestTypeDerivationSemanticPipelineInterface } from '../../../types/upstream/requestTypeDerivationInterface';
import { authorityBackedRouteManifestProjectionFactory } from './routeManifestProjectionAuthority';
import { routeSyncManifestLoweringOperations } from './routeManifestLowerer';
import type { RouteManifest } from './routeManifestInterface';

import type {
  ManifestProjectedOutcome,
  ManifestProjectionBlockedOutcome,
  RouteManifestProjectionCompositionOutcomeHandlers,
  RouteManifestProjectionCompositionResult,
} from './routeManifestProjectionOutcome';
export type {
  ManifestProjectedOutcome,
  ManifestProjectionBlockedOutcome,
  RouteManifestProjectionCompositionOutcomeHandlers,
  RouteManifestProjectionCompositionResult,
} from './routeManifestProjectionOutcome';

export interface RouteManifestProjectionCompositionInterface {
  readonly project: (
    preflight: RouteManifestRequestResolutionPreflight,
    baseURL: string,
    version: string,
  ) => RouteManifestProjectionCompositionResult;
}

export interface RouteManifestProjectionCompositionFactoryInterface {
  readonly create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ) => RouteManifestProjectionCompositionInterface;
}

/**
 * Interface-first factory for the live manifest projection path. The canonical
 * pipeline remains an explicit dependency; this object cannot create a
 * placeholder producer or fall back to the legacy projection solver.
 */
export const routeManifestProjectionCompositionFactory: RouteManifestProjectionCompositionFactoryInterface = Object.freeze({
  create: (pipeline: RequestTypeDerivationSemanticPipelineInterface): RouteManifestProjectionCompositionInterface => {
    const projection = authorityBackedRouteManifestProjectionFactory.create(pipeline);

    return Object.freeze({
      project: (preflight: RouteManifestRequestResolutionPreflight, baseURL: string, version: string): RouteManifestProjectionCompositionResult => {
        const result = projection.project(preflight);
        return result.continue({
          lowered: (lowered) => {
            const outcome: ManifestProjectedOutcome = Object.freeze({
              kind: 'manifest_projected',
              manifest: routeSyncManifestLoweringOperations.lower(preflight.manifest, baseURL, version, {
                kind: 'route_manifest_projection',
                requestTypes: lowered.requestTypes,
                semanticTypes: lowered.semanticTypes,
                sourceEvidence: lowered.sourceEvidence,
                requestResolutionLedger: lowered.requestResolutionLedger,
              }),
              requestTypes: lowered.requestTypes,
              semanticTypes: lowered.semanticTypes,
              sourceEvidence: lowered.sourceEvidence,
              requestResolutionLedger: lowered.requestResolutionLedger,
              derivation: lowered.derivation,
            });
            return Object.freeze({
              ...outcome,
              continue: (handlers: RouteManifestProjectionCompositionOutcomeHandlers): RouteManifest =>
                handlers.manifest_projected(outcome),
            });
          },
          derivation_not_projectable: (blocked) => {
            const outcome: ManifestProjectionBlockedOutcome = Object.freeze({
              kind: 'manifest_projection_blocked',
              sourceEvidence: blocked.sourceEvidence,
              requestResolutionLedger: blocked.requestResolutionLedger,
              derivation: blocked.derivation,
            });
            return Object.freeze({
              ...outcome,
              continue: (handlers: RouteManifestProjectionCompositionOutcomeHandlers): RouteManifest =>
                handlers.manifest_projection_blocked(outcome),
            });
          },
        });
      },
    });
  },
});
