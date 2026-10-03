# Phase 254 — Unified Declarative Control Relation Execution

Phase 254 removes the second semantic rewrite authority that remained in `semanticControlRelationDataFlow.ts`.

## Before

The compiler had two executable semantic programs:

1. `semanticControlProgram.ts`
2. `semanticControlRelationCatalog.ts`

The data-flow projection still invoked the second program directly, while versioning used the first.

## After

All semantic control execution now goes through the unified declarative control program:

```text
SemanticKnowledgeDataFlow
        |
        v
  relation seed adapter
        |
        v
semanticControlProgram
        |
        +--> normalized choice/repetition
        +--> branch/guard/merge
        +--> fixed-point/backedge
        +--> canonical transition/cycle
        +--> scope/dependence
        |
        v
semantic consumers
```

The adapter may iterate over typed facts because this is boundary/projection mechanics. It does not decide control semantics procedurally. The meaning is produced by relation rewrites and fixed-point saturation.

## Why this matters

MLIR's PDLL/PDL architecture treats matching and rewriting as a declarative program/IR, while LLVM MemorySSA overlays a semantic virtual IR on source IR. RouteSync now applies the same separation consistently: parser/source facts are evidence; the relation program is the semantic authority; consumers project solved facts.

## Invariant

`if`, `switch`, `while`, and `for` are not semantic dispatch cases. Their source forms may exist at the evidence boundary, but semantic control is represented by relations and solved by the generic rewrite engine.
