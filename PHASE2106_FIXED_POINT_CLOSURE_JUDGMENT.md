# RouteSync Phase 2106 — Fixed-Point Closure Judgment

## Change

The forward and backward data-flow solver contracts now expose a discriminated fixed-point judgment instead of requiring every caller to accept a relation-only result. The canonical `RelationFixedPoint` ADT is reused, preserving its `fixed_point_converged` and `fixed_point_round_limit_reached` variants.

## Compatibility behavior

Existing `runForwardAnalysis`, `runBackwardAnalysis`, `DataFlowAnalysis.analyze`, and `analyzeBackward` retain their relation-only return shape, but they no longer silently publish an incomplete approximation. If the round cap is reached, they throw `DataFlowFixedPointIncompleteError` with the exact capped judgment attached. Prefer `runForwardAnalysisWithJudgment`, `runBackwardAnalysisWithJudgment`, `analyzeWithJudgment`, or `analyzeBackwardWithJudgment` for explicit exhaustive handling.

## Changed files

- `packages/core/src/compiler/analysis/dataflow/controlFlowDataFlowInterface.ts`
- `packages/core/src/compiler/analysis/dataflow/dataFlowSolveJudgment.ts` (new)
- `packages/core/src/compiler/analysis/dataflow/forwardSolver.ts`
- `packages/core/src/compiler/analysis/dataflow/backwardSolver.ts`
- `packages/core/src/compiler/analysis/DataFlowAnalysis.ts`
- `packages/core/src/compiler/analysis/dataflow/index.ts`
- `packages/core/src/index.ts`
- `scripts/audits/audit-phase2106-fixed-point-closure-judgment.cjs` (new)
- `docs/traces/PHASE2106_FIXED_POINT_CLOSURE_JUDGMENT_TRACE.md` (new)

## Explicit non-claims

This phase does not establish transfer monotonicity, a valid lattice-height bound, or semantic correctness of JSON-stringification equality. It also does not remove the remaining legacy dependencies under Laravel action composition. Those are distinct follow-up tasks.
