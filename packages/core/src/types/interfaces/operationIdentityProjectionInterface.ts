import type { UpstreamWiringInterface } from './interfaceDependencyBoundary';
import type { OperationIdentityCapabilityConsumerInterface } from '../upstream/operationIdentityCapability';
import type { OperationIdentityReference } from '../upstream/operationIdentityCapability';

/**
 * Explicit upstream -> wiring -> downstream boundary for operation identity.
 * The downstream layer receives a closed reference and cannot resolve identity.
 */
/**
 * Explicitly records the intentional narrowing at the SDK-safe identity boundary.
 * The projection keeps the canonical route identity and deliberately omits
 * evidence/proof payloads from the compact runtime reference; those remain on
 * the upstream capability contract and must not be treated as reconstructed.
 */
export interface OperationIdentityProjectionLossContract {
  readonly policy: 'identity_reference_only';
  readonly preserves: readonly ['key', 'method', 'path'];
  readonly omits: readonly ['evidence', 'derivation', 'provenance', 'reasoning'];
}

export interface OperationIdentityProjectionAlgebraInterface
  extends UpstreamWiringInterface<OperationIdentityCapabilityConsumerInterface, OperationIdentityReference> {
  readonly lossContract: OperationIdentityProjectionLossContract;
}

export interface OperationIdentityProjectionContract
  extends OperationIdentityProjectionAlgebraInterface {}

export interface OperationIdentityProjectionInterface
  extends OperationIdentityProjectionContract {}
