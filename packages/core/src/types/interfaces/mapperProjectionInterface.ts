import type { UpstreamWiringInterface } from './interfaceDependencyBoundary';
import type { MapperConsumerInterface } from '../upstream/semanticMapping';

/**
 * Explicit upstream -> wiring -> downstream boundary for mapper semantics.
 * The target carries the closed mapping contract; it contains no derivation.
 */
export interface MapperProjectionTarget {
  readonly mapping: MapperConsumerInterface;
}

export interface MapperProjectionAlgebraInterface
  extends UpstreamWiringInterface<MapperConsumerInterface, MapperProjectionTarget> {}

export interface MapperProjectionContract extends MapperProjectionAlgebraInterface {}
export interface MapperProjectionInterface extends MapperProjectionContract {}
