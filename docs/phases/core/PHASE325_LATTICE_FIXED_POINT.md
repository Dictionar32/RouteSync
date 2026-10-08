# Phase 325 — Explicit Lattice Fixed-Point Contract

## Motivation

The shared relation kernel previously exposed only a generic `step/equal` fixed-point loop. Circular/reference attribute evaluation used that loop with a set-union transfer, while `AttributeLattice<T>` was declared but not used by the evaluator. This phase makes the lattice contract executable and shared.

## Change

`relationLatticeFixedPoint` accepts an explicit lattice (`bottom`, `join`, `equal`), a seed, and a transfer relation. Each round computes:

`next = join(current, transfer(current))`

The join prevents a monotone analysis from retracting established facts. Convergence is decided by the lattice equality relation; a round limit remains a safety bound, not a proof of convergence.

`evaluateAttributeRelations` now supplies the finite-set lattice of attribute facts:

- bottom: empty fact relation
- join: deduplicating union
- equality: extensional equality over canonical fact keys
- transfer: evaluate attribute equations whose explicit `(attribute, node)` dependencies are present

## Research alignment

- JastAdd's circular attributes start from a bottom value and iterate equations until stable; its documentation identifies finite-height lattices and monotonicity as convergence conditions.
- Soufflé models analysis data as typed relations and evaluates recursive rules to a fixed point.
- egglog combines Datalog-style relational reasoning with equality saturation; it is a useful later target for combining RouteSync's semantic closure and rewrite phases.
- Statix models static semantics as constraints and name resolution through scope graphs. RouteSync's reference dependencies should remain explicit rather than being inferred from traversal order.
- MLIR PDLL/PDL separates declarative pattern matching from rewrite construction. RouteSync should preserve the same boundary between semantic matching and lowering/rewrite effects.

## Validation status

Both changed TypeScript files parse with zero TypeScript parser diagnostics. A targeted `tsc --noEmit` invocation still reports pre-existing type errors in `relationalSequence.ts` around relation-option narrowing and the `relationChoose` branch catalog. Therefore this phase does **not** claim a clean type-check.

## Next required work

1. Repair relation-option narrowing in the shared kernel using a type-safe witness API without casts.
2. Add finite-height/monotonicity contracts or runtime diagnostics for lattice transfers.
3. Make rewrite negative-pattern semantics explicit; do not silently treat negation as an ordinary positive match.
4. Continue migration of parser and adapters by semantic family, preserving continuation and diagnostics.
