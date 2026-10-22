# Phase 2130 — Canonical Dataflow Knowledge Boundary

## Trace finding

The existing `ControllerDataflowSemanticJudgmentAuthorityInterface` already owns source-correlated binding correspondence, variable identity, flow composition, and integrated response composition. `createControllerDataflowAnalyzer` packages the canonical invocation source, semantic-knowledge projection, and PHP payload evidence into one authority input.

The action path nevertheless exposed dataflow only through the legacy `ControllerActionContract.dataflow` wrapper. That wrapper contains both `ControllerSemanticVariableFlow` and resource-binding aggregation, which obscured the difference between canonical flow knowledge and legacy orchestration.

## Change

- `LaravelControllerActionSemanticKnowledge` now publishes `dataflow: ControllerSemanticVariableFlow`.
- The production adapter forwards `result.contract.dataflow.semantic` into the semantic knowledge surface.
- Action semantic contract version advances to 7.
- Coverage now lists `dataflow` as published knowledge and leaves only `body` and `schema` in the projection remainder.
- Coverage explicitly states that body/schema and resource-binding aggregation remain in the legacy action resolver path.
- Existing audits were updated to check the current interface contract rather than stale version-6 assumptions.
- Added `scripts/audits/audit-phase2130-canonical-dataflow-knowledge-boundary.cjs`.

## What this does not claim

This is not a complete migration of `resolveControllerActionContract`. The action adapter still calls `scanControllerAction`, and the legacy contract still aggregates resource bindings using the existing resource-binding authority. The new interface exposes the canonical flow value, but body/schema ownership and resolver retirement remain open work.

## Validation boundary

The Phase 2130 audit is static. No build, TypeScript typecheck, or Vitest run is claimed.
