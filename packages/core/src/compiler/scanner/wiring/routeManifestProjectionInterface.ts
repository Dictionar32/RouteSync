import type { UpstreamWiringInterface } from '../../../types/interfaces/interfaceDependencyBoundary';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';
import type { RequestTypeDerivationInput, RequestTypeDerivationSemanticInputPreparation, RequestTypeEvidenceReference, RequestTypeDerivationIdentityCollisionInventory, RequestTypeRequestResolutionAssessment, RequestTypeRouteRequestResolutionReceipt, RequestTypeResourceResolutionAssessment, RequestTypeRouteResourceResolutionReceipt } from '../../../types/upstream/requestTypeDerivationInterface';

/**
 * Downstream materialization input produced from the completed upstream
 * manifest. This is wiring data, not a new semantic authority.
 */
export interface RouteManifestProjection {
  readonly kind: 'route_manifest_projection';
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
  /** Source provenance is preserved across the manifest projection boundary. */
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  /** Retained request-resolution ADTs from the upstream semantic operation. */
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
}


/** Exact manifest and upstream evidence/resolution packet bound to one projection. */
export interface RouteManifestProjectionInput {
  readonly manifest: RouteSyncManifest;
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
  readonly resourceResolutionLedger: readonly RequestTypeRouteResourceResolutionReceipt[];
}

/** Downstream-owned boundary: upstream manifest -> RouteManifest projection data. */
export interface RouteManifestProjectionInterface
  extends UpstreamWiringInterface<RouteManifestProjectionInput, RouteManifestProjection> {}


/** Resolution-only preflight; it must complete before type lowering executes. */
export interface RouteManifestRequestResolutionPreflight {
  readonly kind: 'route_manifest_request_resolution_preflight';
  /** Original manifest and semantic input are bound into this single preflight packet. */
  readonly manifest: RouteSyncManifest;
  /** Exact semantic input packet used to produce this inventory and its ledgers. */
  readonly input: RequestTypeDerivationInput;
  /** Complete upstream preparation packet passed intact to semantic reasoning. */
  readonly semanticInput: RequestTypeDerivationSemanticInputPreparation;
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  /** Canonical identity collisions remain explicit evidence for upstream reasoning. */
  readonly identityCollisionInventory: RequestTypeDerivationIdentityCollisionInventory;
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
  readonly assessment: RequestTypeRequestResolutionAssessment;
  readonly resourceResolutionLedger: readonly RequestTypeRouteResourceResolutionReceipt[];
  readonly resourceAssessment: RequestTypeResourceResolutionAssessment;
}

/** Source inventory and request-resolution gate, intentionally independent of projection. */
export interface RouteManifestRequestResolutionPreflightInterface {
  readonly evaluate: (manifest: RouteSyncManifest) => RouteManifestRequestResolutionPreflight;
}
