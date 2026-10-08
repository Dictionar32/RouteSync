/**
 * Directional interface-dependency algebra.
 *
 * The algebra contains only the structural operation needed to carry an
 * already-authoritative upstream value into a downstream contract. Semantic
 * inference, classification, lookup, and resolution do not belong here.
 */
export interface InterfaceDependencyAlgebraInterface<Upstream, Downstream> {
  readonly project: (upstream: Upstream) => Downstream;
}

/**
 * Contract layer for the dependency algebra. Keeping the contract distinct
 * from the public boundary mirrors the upstream semantic
 * algebra -> contract -> interface shape.
 */
export interface InterfaceDependencyContractInterface<Upstream, Downstream>
  extends InterfaceDependencyAlgebraInterface<Upstream, Downstream> {}

/**
 * Backward-compatible named dependency boundary. It is the public contract
 * specialization; ownership remains with the downstream wiring/projection.
 */
export interface InterfaceDependencyBoundary<Upstream, Downstream>
  extends InterfaceDependencyContractInterface<Upstream, Downstream> {}

/**
 * Explicit upstream -> wiring -> downstream contract.
 *
 * This is wiring, not semantic authority: it records direction and requires
 * the upstream value to already be authoritative before projection.
 */
export interface UpstreamWiringInterface<Upstream, Downstream>
  extends InterfaceDependencyBoundary<Upstream, Downstream> {
  readonly direction: 'upstream_to_downstream';
  readonly upstreamAuthority: 'upstream';
}
