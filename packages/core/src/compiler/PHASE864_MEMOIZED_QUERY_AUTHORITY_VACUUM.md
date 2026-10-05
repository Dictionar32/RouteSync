# Phase 864 — Memoized Query Authority Vacuum

## Trace

`MemoizedQueryDatabase → QueryCell → dependency/cache state` has no production construction or consumer path. Its only concrete external usage was the SDK test that instantiated the legacy public surface.

The active incremental path is instead:

```text
SalsaCompiler
  → QueryGraphManager
  → queryExecutor.recordDependency()
  → dependency closure / invalidation
  → query re-execution
```

This matches the authority rule used in the preceding phases: a dependency graph is retained when it has a real producer and consumer/solver path. MLIR similarly couples dependency relations to its data-flow solver, while CodeQL models graph edges as explicit semantic flow steps between source and sink.

## Change

The following legacy files are **retained but emptied**, never deleted:

- `packages/core/src/compiler/query/QueryCell.ts`
- `packages/core/src/compiler/query/database/memoizedDatabase.ts`

Their exports were removed from the query/database/compiler barrels and the SDK test for the orphaned API was removed. `TypedCache`, `QueryDatabase`, and the Salsa query engine remain intact.

## Invariant

```text
legacy file exists = true
legacy file content = empty
legacy production construction = none
legacy production import = none
Salsa dependency authority = intact
```
