# Phase 907 — Upstream Dataflow Authority Interface

Phase 906 removed the duplicate primitive `dataflow_relation` representation from `AstAnalysisFact`, but the analysis interface still exposed only the raw `AstDataflowJudgment` through its judgment payload.

Phase 907 makes the boundary explicit: `AstAnalysisInterface` now exposes an `AstDataflowInterface` that wraps the exact same `AstDataflowJudgment`.

```text
AstDataflowJudgment
       ↓
AstDataflowInterface
       ↓
AstAnalysisInterface
       ↓
semantic consumers
```

No source/target numbers, strings, or graph-edge compatibility shape are introduced. The upstream `AstDataflowInterface` remains the sole dataflow authority.
