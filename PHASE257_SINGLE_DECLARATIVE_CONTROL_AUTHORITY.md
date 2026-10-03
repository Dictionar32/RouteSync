# Phase 257 — Single Declarative Control Authority

## Goal

Remove the remaining legacy semantic-control execution API so control semantics are represented only as relation facts and solved by the unified declarative control program.

## Changes

- `semanticControlRelationCatalog.ts` is now ontology + declarative rewrite rules only.
- Removed the legacy `solveSemanticControlRelations()` execution path.
- Removed legacy semantic relation factories from the catalog:
  - `semanticConditionalRelations()`
  - `semanticMultiwayRelations()`
  - `semanticIterationRelations()`
- Added `semanticControlTestFacts.ts` as a test-only relation-seed fixture. It constructs tuples; it does not execute semantic rewrites.
- `semanticControlVersioning.ts` now accepts `SemanticControlProgramFact` directly and projects the result of the unified program.
- Historical tests from Phases 234/242/243/247/248/253 were migrated to the unified solver.

## Authority invariant

```text
syntax / parser evidence
        ↓
relation facts
        ↓
semanticControlProgram
        ↓
generic relation solver
        ↓
canonical semantic control
```

There is no second semantic-control solver.

## Why this matters

`if`, `switch`, `while`, and `for` remain syntax/evidence concepts at the parser boundary, but semantic consumers operate on relations such as `choice`, `alternative`, `iteration`, `guard`, `merge`, `fixed_point`, `control_scope`, and versioning facts.

This follows the same architectural direction as MLIR declarative pattern rewriting: matching is represented separately from rewriting, and the rewrite program is executed by generic rewrite infrastructure.
