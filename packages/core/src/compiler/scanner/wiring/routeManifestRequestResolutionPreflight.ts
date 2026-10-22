import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import { requestTypeDerivationSemanticInputPreparation } from '../../semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation';
import type { RouteManifestRequestResolutionPreflight, RouteManifestRequestResolutionPreflightInterface } from './routeManifestProjectionInterface';
import { routeManifestProjectionInputs } from './routeManifestProjectionInputs';

const evaluate: RouteManifestRequestResolutionPreflightInterface['evaluate'] = (manifest: RouteSyncManifest): RouteManifestRequestResolutionPreflight => {
  const input = Object.freeze({
    routes: routeManifestProjectionInputs.routeFlowsFromManifest(manifest),
    resources: routeManifestProjectionInputs.resourceAstsFromManifest(manifest),
    requests: routeManifestProjectionInputs.requestAstsFromManifest(manifest),
  });
  const prepared = requestTypeDerivationSemanticInputPreparation.prepare(input);

  return Object.freeze({
    kind: 'route_manifest_request_resolution_preflight',
    manifest,
    input: prepared.input,
    semanticInput: prepared,
    sourceEvidence: prepared.sourceEvidence,
    identityCollisionInventory: prepared.identityCollisionInventory,
    requestResolutionLedger: prepared.requestResolutionLedger,
    assessment: prepared.requestAssessment,
    resourceResolutionLedger: prepared.resourceResolutionLedger,
    resourceAssessment: prepared.resourceAssessment,
  });
};

/** Manifest adaptation stays in scanner wiring; semantic preparation stays upstream-owned. */
export const routeManifestRequestResolutionPreflight: RouteManifestRequestResolutionPreflightInterface = Object.freeze({ evaluate });
