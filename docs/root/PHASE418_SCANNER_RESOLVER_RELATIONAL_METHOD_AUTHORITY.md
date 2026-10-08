# Phase 418 — Scanner/Resolver relational method authority

## Basis
- MLIR PDLL: declarative match/constraint/rewrite separation.
- MLIR DRR: source pattern, result pattern, additional constraints.
- egglog: Datalog + equality saturation.
- JastAdd: circular attributes and monotone fixed-point evaluation.

## Change
`resourceProducer.ts` no longer uses a `Map.get()`-based method catalog as the semantic lookup authority. Method entries are represented as relation tuples and resolved through `relationLookup` and `relationOptionFold`.

Feature-method fallback selection is routed through the same relational lookup boundary rather than nullish-coalescing lookup expressions.

## Boundary
This phase deliberately does not erase PHP source vocabulary such as `if`, `for`, `===`, etc. when those values are data describing source syntax. Those are lexical evidence, not host-language semantic control flow.

## Validation
- TypeScript transpilation of `resourceProducer.ts`: 0 diagnostics.
- Repository-wide typecheck remains environment-blocked by the existing dependency/type-definition state.
