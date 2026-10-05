# Phase 865 — Query Graph Authority Closure

Phase 865 closes the incremental Salsa dependency path around the single `QueryGraphManager` authority.

## Trace

`SalsaCompiler` creates one `QueryGraphManager`. `queryExecutor` records parent/child dependencies through that manager and delegates dependent invalidation to it.

## Fix

A recomputation now begins through `QueryGraphManager.beginEvaluation(keyId)`. The manager removes the query from stale reverse-dependency lists and clears its outgoing dependency relation before evaluation. Dependencies discovered during the fresh computation are then recorded back through `recordDependency` and preserved when the final node state is committed.

The executor also restores its active query stack with `finally`, so a failed query cannot poison subsequent executions.

## Authority invariant

```text
query execution
  -> QueryGraphManager.recordDependency
  -> relation-backed dependency/dependent indexes
  -> QueryGraphManager.invalidateDependents
  -> dependent recomputation
```

No second dependency mutation surface is introduced. `MemoizedQueryDatabase`/`QueryCell` remains vacuumed from Phase 864.
