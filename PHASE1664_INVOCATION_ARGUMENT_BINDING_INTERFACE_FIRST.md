# RouteSync Phase 1664 — Invocation Argument Binding Interface-First

## Scope

This phase intentionally changes the upstream invocation semantic interface first. It does **not** migrate algebra, authority implementation, runtime executor, scanner, tests, or downstream wiring yet. Those consumers are expected to be aligned in the subsequent wiring phase.

## Contract changes

- Introduces `InvocationArgumentBindingJudgment` with explicit domain outcomes: `not-required`, `established`, `incomplete`, and `blocked`.
- Makes `InvocationArgumentBindingSemantics` a first-class part of `InvocationSemanticMeaningModel`, `InvocationSemanticModel`, and `InvocationSemanticContract`.
- Changes the argument-binding witness contract from a flat `bindings`/`evidence` payload to a typed `judgment`.
- Replaces flat `argumentParameters` in a single invocation judgment with `argumentBinding`; aggregate analysis now exposes `argumentBindings`.
- Changes proof vocabulary from `retainBindings` to `retainArgumentBindingJudgment` and binds `argument-binding-judgment` explicitly.
- Bumps invocation semantic model version 8 → 9 and contract version 19 → 20.

## Deliberately deferred

The old algebra/wiring still constructs the previous witness shape and aggregate fields. That is intentional for this interface-first phase; the next phase must migrate those consumers to the new domain judgment and remove collection-emptiness-driven witness construction. This ZIP is a staged source change, not a claim that the full repository currently type-checks.

## Architecture reference

The design follows the separation principle described in the official [MLIR Interfaces documentation](https://mlir.llvm.org/docs/Interfaces/): generic consumers should interact with domain contracts rather than encode operation-specific semantics in their own logic. The [MLIR dataflow analysis tutorial](https://mlir.llvm.org/docs/Tutorials/DataFlowAnalysis/) is also relevant for keeping analysis state/results distinct from the mechanism that propagates them.
