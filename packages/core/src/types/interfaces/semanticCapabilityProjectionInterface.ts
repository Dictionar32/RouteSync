import type { SemanticCapabilityContract } from '../upstream/semanticCapability';
import type { UpstreamWiringInterface } from './interfaceDependencyBoundary';

/**
 * Downstream-owned projection algebra for an already-closed upstream capability.
 *
 * The upstream capability contract never depends on this interface. The
 * downstream boundary declares how it materializes or consumes that capability.
 */
export interface SemanticCapabilityProjectionAlgebraInterface<
  Capability extends SemanticCapabilityContract,
  Output,
> extends UpstreamWiringInterface<Capability, Output> {}

export interface SemanticCapabilityProjectionContract<
  Capability extends SemanticCapabilityContract,
  Output,
> extends SemanticCapabilityProjectionAlgebraInterface<Capability, Output> {}

export interface SemanticCapabilityProjectionInterface<
  Capability extends SemanticCapabilityContract,
  Output,
> extends SemanticCapabilityProjectionContract<Capability, Output> {}
