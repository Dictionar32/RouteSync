# Phase 673 — AST Interface Transition Closure

Phase 673 elevates RouteSync from a collection of closed stage interfaces to a **closed transition algebra**.

## Semantic model

```text
source syntax
    -> scanner evidence
    -> upstream mapping
    -> resolver graph
    -> analysis
    -> semantic type lowering
    -> target projection
```

Every edge is now an `AstSemanticStageTransition` carrying:

- source stage
- target stage
- semantic relation
- preservation obligations
- refinement mode
- typed cross-stage proof
- transition status

The authority pipeline carries all five transitions. Stage interfaces therefore transport judgments, while the transition algebra owns the legality/refinement boundary between judgments.

## Analysis elevation

The CFG instruction ADT no longer encodes return absence through an optional property. `ReturnValue` is a closed algebra:

- `return_value`
- `return_void`

SSA renaming consumes typed relation variants instead of `Extract` assertions and constructs typed instruction variants through constructors.

## Validation

- Phase 673 transition audit: PASS
- Phase 672 authority audit: PASS
- Phase 671 frontier audit: PASS
- Phase 670 refinement audit: PASS
- Phase 669 proof-rewrite audit: PASS
- Phase 668 closure audit: PASS
- Phase 525 inactive-file vacuum: PASS
- Production transpilation: 1469 files, 0 failures
- Full `tsc --noEmit`: environment-blocked only by missing `node` and `vitest/globals` type definitions

The AST audit uses the TypeScript AST rather than raw regex so comments and source-language vocabulary are not misclassified as host-language semantic constructs.
