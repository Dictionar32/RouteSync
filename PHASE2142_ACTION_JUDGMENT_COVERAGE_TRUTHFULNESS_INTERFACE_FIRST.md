# Phase 2142 — Action Judgment Coverage Truthfulness (Interface First)

## Trace

`LaravelControllerScanner` obtains the action judgment through `actionJudgment.judge(...)` and passes that exact object to `actionExecution.execute(...)`. The executor returns the same judgment object. However, the prior discriminator `controller_action_semantic_judgment_completed` implied semantic closure while the authority contract explicitly declared partial knowledge and three derivation-ownership gaps.

## Change

- Renamed the action judgment discriminator to `controller_action_semantic_judgment_published` so publication is not misrepresented as completed semantic closure.
- Added a value-level `coverage: LaravelControllerActionSemanticKnowledgeCoverage` witness to the judgment.
- Defined `controllerActionSemanticKnowledgeCoverage` once and reused it in both the produced judgment and authority contract, avoiding divergent descriptions of coverage.
- Advanced the action semantic judgment contract to version 12.
- Updated the runtime executor contract to state that it forwards the published judgment and does not upgrade its coverage.
- Added `scripts/audits/audit-phase2142-action-judgment-coverage-truthfulness.cjs`.

## Still open (not claimed migrated)

- Production action derivation still calls `scanControllerAction(...)` and `resolveControllerActionContract(...)`.
- Body source AST remains in the projection.
- Resource-binding aggregation still traverses the legacy action contract.
- Request binding still uses the compatibility adapter.

## Constraints preserved

No `relation`/`foundation` layer, no new subscanner, no moving legacy functions to another file as a substitute for semantic migration. No full build, full typecheck, or Vitest was run.
