/**
 * Type-level dependency boundary between an upstream contract and a downstream
 * materialization/consumer contract.
 *
 * The direction is intentional: downstream owns the boundary and depends on
 * the upstream value. Upstream contracts must not import or implement this
 * boundary merely to become consumable downstream.
 */
export interface InterfaceDependencyBoundary<Upstream, Downstream> {
  readonly project: (upstream: Upstream) => Downstream;
}
