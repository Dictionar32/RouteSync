import type { UpstreamWiringInterface } from './interfaceDependencyBoundary';

/**
 * Compositional upstream -> wiring -> downstream algebra.
 *
 * A boundary may consume an upstream contract and produce an intermediate
 * contract; the next boundary consumes that intermediate contract. This keeps
 * dependency direction explicit without making upstream know downstream.
 */
export interface InterfaceCompositionAlgebra<Upstream, Intermediate, Downstream>
  extends UpstreamWiringInterface<Upstream, Downstream> {
  readonly first: UpstreamWiringInterface<Upstream, Intermediate>;
  readonly second: UpstreamWiringInterface<Intermediate, Downstream>;
}

/** Named contract for a closed composition of two directional wiring stages. */
export interface InterfaceCompositionContract<Upstream, Intermediate, Downstream>
  extends InterfaceCompositionAlgebra<Upstream, Intermediate, Downstream> {}

/**
 * Backward-compatible composition name. The contract is directional and
 * executable only through the two declared projection stages.
 */
export interface InterfaceComposition<Upstream, Intermediate, Downstream>
  extends InterfaceCompositionContract<Upstream, Intermediate, Downstream> {}

/**
 * Compose two already-authoritative upstream -> downstream projections.
 * No semantic resolution is introduced at this boundary: the only operation
 * is transport/projection through the declared intermediate contract.
 */
export const composeUpstreamWiring = <Upstream, Intermediate, Downstream>(
  first: UpstreamWiringInterface<Upstream, Intermediate>,
  second: UpstreamWiringInterface<Intermediate, Downstream>,
): InterfaceCompositionContract<Upstream, Intermediate, Downstream> => Object.freeze({
  first,
  second,
  direction: 'upstream_to_downstream' as const,
  upstreamAuthority: 'upstream' as const,
  project: (upstream: Upstream): Downstream => second.project(first.project(upstream)),
});
