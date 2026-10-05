# Phase 863 — Dependency Authority Path

This phase traces dependency authorities by execution path rather than by symbol presence.

## Findings

- `AnalysisManager` owns `AnalysisDependencyGraph`, recursive dependent closure, and cache invalidation. No production caller constructs or registers dependencies outside the owner; current concrete consumers are tests/framework documentation.
- `SalsaCompiler` creates exactly one `QueryGraphManager`; `queryExecutor` records dependencies and invalidates dependents on changed results. This is a coherent internal incremental-query authority.
- Phase 864 traced `MemoizedQueryDatabase` and `QueryCell`: no production construction/consumer path exists, while `SalsaCompiler → QueryGraphManager → queryExecutor` is the coherent incremental dependency authority. The legacy `MemoizedQueryDatabase`/`QueryCell` implementation is therefore vacuumed by emptying the files and removing their exports; the files themselves are retained.
- No file is deleted. Potential future orphan files must be emptied, not removed.

## Rule

A dependency implementation is considered an active authority only when its producer and semantic consumer/solver path can be traced. Similar names or duplicated mechanics are not sufficient grounds for merging or vacuuming.
