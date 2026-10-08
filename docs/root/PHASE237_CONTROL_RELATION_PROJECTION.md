# Phase 237 — Declarative Control Relation Projection

## Goal

Push the `choice` / `repetition` semantic layer one step further away from
source-language control syntax. Control semantic projection must be driven by
canonical semantic fact kinds and relation catalogs, not `if`/`switch` dispatch.

## Research basis

- MLIR PDLL separates pattern matching from rewriting and represents rewrites
  declaratively.
- MLIR PDL represents pattern matching/rewrite infrastructure as IR.
- LLVM MemorySSA represents state through def/use/phi relations and versions.

## Changes

`semanticControlRelationDataFlow.ts` now uses a declarative projector registry:

```text
semantic fact kind
       ↓
projector registry
       ↓
control relation tuples
       ↓
semantic control rewrite catalog
       ↓
relation solver / fixed point
```

Presence handling is also represented through a kind-indexed projector rather
than semantic `if`/`switch` dispatch.

The semantic-control projection file contains no `if` or `switch` keyword.
Any loops used by the generic relation engine remain solver mechanics, not
semantic definitions.

## Validation

- Focused strict TypeScript compilation: PASS
- Relation solver runtime regression: PASS
- Semantic-control projection `if` count: 0
- Semantic-control projection `switch` count: 0
