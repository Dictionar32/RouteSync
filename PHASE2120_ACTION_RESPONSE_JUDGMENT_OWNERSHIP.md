# Phase 2120 — Action Response Judgment Ownership

## Goal

Move the scanner's response-presence projection behind the existing action semantic judgment contract. The scanner should consume a closed `ControllerResponse` ADT owned by the completed action judgment, rather than call `responseTypeName()` on the compiler descriptor itself.

## Change

- `LaravelControllerActionSemanticJudgment` now carries `response: ControllerResponse`.
- The existing production composition adapter derives that ADT at the semantic judgment boundary from the legacy action result.
- `LaravelControllerScannerExecutor` consumes `result.semanticJudgment.response` when building method evidence.
- Runtime execution still forwards the exact action judgment object and does not reconstruct it.

## Trace

```text
invocation judgment
  -> action judgment input
  -> legacy action analysis (current implementation, still a migration debt)
  -> completed action judgment { invocationJudgment, response ADT, contract, dependencies }
  -> runtime executor (identity-preserving forwarding)
  -> scanner projects method evidence from judgment-owned response
  -> integrated response pipeline correlates declaration evidence with the same invocation judgment
  -> AST projection
```

## Boundary

This phase removes response descriptor interpretation from `LaravelControllerScannerExecutor`; it does not yet retire `scanControllerAction` or prove the transitive graph is free of relation/foundation/subscanner modules. The adapter remains the explicit legacy migration seam. No build, typecheck, or Vitest run is claimed.
