import type { RouteManifestRequestResolutionPreflight } from './routeManifestProjectionInterface';
import type { RequestTypeDerivationSemanticPipelineInterface, RequestTypeEvidenceReference, RequestTypeRouteRequestResolutionReceipt } from '../../../types/upstream/requestTypeDerivationInterface';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';
import type { RequestTypeDerivationRuntimeExecutionResult } from '../../../types/upstream/requestTypeDerivationInterface';
import { createAuthorityBackedRouteManifestProjection } from './routeManifestProjectionAuthority';
import { lowerRouteSyncManifestToRouteManifest } from './routeManifestLowerer';
import type { RouteManifest } from './routeManifestInterface';

/**
 * Closed result of the authority-backed manifest composition operation.
 * A manifest is only materialized after the injected semantic pipeline has
 * produced a projectable, verified judgment. Failure is data, never fallback.
 */
export type RouteManifestProjectionCompositionResult =
  | Readonly<{
      kind: 'manifest_projected';
      manifest: RouteManifest;
      requestTypes: readonly RequestType[];
      semanticTypes: readonly ObjectType[];
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
      derivation: Extract<RequestTypeDerivationRuntimeExecutionResult, { kind: 'projected' }>;
    }>
  | Readonly<{
      kind: 'manifest_projection_blocked';
      sourceEvidence: readonly RequestTypeEvidenceReference[];
      requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
      derivation: Exclude<RequestTypeDerivationRuntimeExecutionResult, { kind: 'projected' }>;
    }>;

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
    const projection = createAuthorityBackedRouteManifestProjection(pipeline);

    return Object.freeze({
      project: (preflight: RouteManifestRequestResolutionPreflight, baseURL: string, version: string): RouteManifestProjectionCompositionResult => {
        const result = projection.project(preflight);
        switch (result.kind) {
          case 'projected':
            return Object.freeze({
              kind: 'manifest_projected',
              manifest: lowerRouteSyncManifestToRouteManifest(preflight.manifest, baseURL, version, {
                kind: 'route_manifest_projection',
                requestTypes: result.requestTypes,
                semanticTypes: result.semanticTypes,
                sourceEvidence: result.sourceEvidence,
                requestResolutionLedger: result.requestResolutionLedger,
              }),
              requestTypes: result.requestTypes,
              semanticTypes: result.semanticTypes,
              sourceEvidence: result.sourceEvidence,
              requestResolutionLedger: result.requestResolutionLedger,
              derivation: result.derivation,
            });
          case 'not_projectable':
            return Object.freeze({
              kind: 'manifest_projection_blocked',
              sourceEvidence: result.sourceEvidence,
              requestResolutionLedger: result.requestResolutionLedger,
              derivation: result.derivation,
            });
          default: {
            const exhaustive: never = result;
            return exhaustive;
          }
        }
      },
    });
  },
});
