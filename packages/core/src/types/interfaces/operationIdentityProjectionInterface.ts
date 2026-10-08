import type { UpstreamWiringInterface } from './interfaceDependencyBoundary';
import type { OperationIdentityCapabilityConsumerInterface } from '../upstream/operationIdentityCapability';
import type { OperationIdentityReference } from '../upstream/operationIdentityCapability';

/**
 * Explicit upstream -> wiring -> downstream boundary for operation identity.
 * The downstream layer receives a closed reference and cannot resolve identity.
 */
export interface OperationIdentityProjectionAlgebraInterface
  extends UpstreamWiringInterface<OperationIdentityCapabilityConsumerInterface, OperationIdentityReference> {}

export interface OperationIdentityProjectionContract
  extends OperationIdentityProjectionAlgebraInterface {}

export interface OperationIdentityProjectionInterface
  extends OperationIdentityProjectionContract {}
