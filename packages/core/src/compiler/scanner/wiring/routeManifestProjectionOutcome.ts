import type { RequestTypeEvidenceReference, RequestTypeRouteRequestResolutionReceipt, RequestTypeDerivationProjectableRuntimeExecutionData, RequestTypeDerivationBlockedRuntimeExecutionData } from '../../../types/upstream/requestTypeDerivationInterface';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';
import type { RouteManifest } from './routeManifestInterface';

/** Successful composition payload. The ADT variant owns its domain continuation. */
export interface ManifestProjectedOutcome {
  readonly kind: 'manifest_projected';
  readonly manifest: RouteManifest;
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
  readonly derivation: RequestTypeDerivationProjectableRuntimeExecutionData;
}

/** Blocked composition payload preserves the exact upstream failure evidence. */
export interface ManifestProjectionBlockedOutcome {
  readonly kind: 'manifest_projection_blocked';
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
  readonly derivation: RequestTypeDerivationBlockedRuntimeExecutionData;
}

/** Domain-specific follow-up policy. Blocked handling must terminate, not fabricate a manifest. */
export interface RouteManifestProjectionCompositionOutcomeHandlers {
  readonly manifest_projected: (outcome: ManifestProjectedOutcome) => RouteManifest;
  readonly manifest_projection_blocked: (outcome: ManifestProjectionBlockedOutcome) => never;
}

/**
 * Closed ADT variants carry an operation to continue from that specific outcome.
 * The operation is installed by the variant constructor, so consumers do not
 * inspect `kind` and a generic visitor/fold primitive is not introduced.
 */
export type RouteManifestProjectionCompositionResult =
  | (Readonly<ManifestProjectedOutcome> & Readonly<{
      readonly continue: (handlers: RouteManifestProjectionCompositionOutcomeHandlers) => RouteManifest;
    }>)
  | (Readonly<ManifestProjectionBlockedOutcome> & Readonly<{
      readonly continue: (handlers: RouteManifestProjectionCompositionOutcomeHandlers) => RouteManifest;
    }>);

