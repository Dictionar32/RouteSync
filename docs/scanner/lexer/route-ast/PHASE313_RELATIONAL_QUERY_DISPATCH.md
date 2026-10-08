# Phase 313 — Relational Query Dispatch Boundary

Phase 313 continues the declarative semantic migration from Phase 312.

## Research basis

The design follows the common boundary visible in declarative compiler/analysis systems:

- relations represent semantic candidates/facts;
- constraints determine applicability;
- rewrite rules produce canonical semantic relations;
- recursive/fixed-point evaluation supplies closure;
- syntax dispatch is evidence, not semantic authority.

Relevant systems reviewed for this phase include MLIR PDLL/DRR, Souffle, K Framework, egglog, Flix, Ascent and DDlog/differential dataflow.

## Changes

### Query operation dispatch

`queryOperationFromNamedMethod` no longer owns a `switch` dispatcher. Method names are represented through a declarative rule catalog and projected relation entries.

The nested relation-operation switch was also replaced with `queryRelationOperationCatalog`.

### Collection execution

`queryProducer.ts` no longer uses:

- `for`
- `while`
- `switch`
- `.map()`
- `.filter()`
- `.reduce()`
- `.flatMap()`

for its query traversal/collection execution surface.

Traversal is expressed through recursive relation projection/expansion. `relationalSequence.ts` gains `relationExpand` as the canonical relational analogue of expansion/flattening.

### Sequence traversal

Several linked-list traversals in query semantics were moved to recursive relation functions. Query-column references, validated column references, column comparisons, closure captures, nested-query discovery and top-level query production now use relational recursion/expansion.

## Explicit remaining work

`queryProducer.ts` still contains imperative `if` guards. They are deliberately not hidden behind another helper or renamed dispatcher. Eliminating these requires a continuation/fixed-point rewrite of guard semantics so that the remaining computation becomes the false/true branch of a relation rule rather than merely changing syntax.

`astClassifier.ts` also still contains imperative syntax-evidence parsing. It remains a parser/evidence boundary and has not been falsely declared semantic-free by this phase.

The already-established semantic Route AST boundary, syntax-error relation core, generic constraint solver, UnionFind, ternary semantic handler, adapter surfaces and relational rewrite/closure engines remain construct-free under the Phase 313 AST audit.
