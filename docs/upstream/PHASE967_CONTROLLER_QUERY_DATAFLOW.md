# Phase 967 — Upstream Controller Query Dataflow

## Migration

Controller query evidence is now carried by the upstream `ControllerSemanticDataflow` contract and projected into canonical `SemanticDataflowInput` seeds.

Chain:

`controller semantic value -> query predicate/key/mutation input -> query invocation`

The projection does not solve reachability, infer model binding, or create a second fixed-point authority. `createSemanticDataflowJudgment()` remains the sole closure authority.

## Evidence

- Existing `QueryAst` already carries model identity, source span, query operations, and nested-query evidence.
- `ControllerQueryEvidence` retains model, query kind, source span, and source-backed input expressions.
- High-value Laravel operations covered include `where`, `whereKey`, `find`, `findOrFail`, and common mutation/query value operations.
- The ecommerce fixture contains controller Eloquent queries and request/route-derived values that can now be represented without inventing a separate dataflow graph.

## Ownership

Scanner/query producer owns syntax-derived evidence.
Upstream owns the evidence contract and seed projection.
Semantic dataflow authority owns closure/fixed point/path derivation.
Downstream consumes the canonical analysis interface.

## Explicit non-claims

This phase does not claim implicit Laravel model binding for scalar route parameters. It also does not synthesize query-result identities where the source does not expose a safe result binding.
