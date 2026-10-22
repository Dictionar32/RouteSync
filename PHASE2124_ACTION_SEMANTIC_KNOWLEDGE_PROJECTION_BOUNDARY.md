# Phase 2124 — Action Semantic Knowledge / Projection Boundary

## Interface-first change

Evolved the existing `LaravelControllerActionSemanticJudgmentInterface`; no parallel action authority was introduced.

The completed judgment now explicitly separates:

- `semantic`: canonical action knowledge (`actionName`, canonical `ControllerResponse`, dependencies, semantic return ADT, and runtime return model), using existing domain types.
- `projection`: the consumer-owned compiler representation (`ControllerActionContract` at the current composition boundary).
- `invocationJudgment`: the exact invocation outcome ADT supplied to the action judgment; source identity remains owned by that value.

Added `LaravelControllerActionSemanticJudgmentContract` version 2 to state this boundary. Exported the evolved types through `packages/core/src/index.ts`.

## Runtime and scanner changes

- `LaravelControllerScannerExecutor` now reads canonical response and dependencies from `semanticJudgment.semantic`.
- Compiler-only work reads `semanticJudgment.projection` explicitly.
- `LaravelControllerActionExecutionInterface` documents that its executor forwards the exact judgment and does not derive semantics from the projection.
- The runtime implementation preserves the exact `semanticJudgment` object.
- Invocation remains a closed four-outcome ADT.
- The existing integrated response pipeline remains the owner of `judgeIntegratedResponse`, source correlation, evidence binding, response judgment, and AST projection. It was not duplicated.

## Important remaining debt

The current production adapter in `laravelControllerExecutionDependencies.ts` still calls `scanControllerAction()` and copies its current results into the new semantic surface. This phase makes the ownership boundary explicit and prepares downstream consumers, but it does **not** claim that legacy semantic derivation has been retired. The next migration must evolve upstream authorities to produce the semantic knowledge directly, then remove this adapter dependency without merely moving the legacy resolver.

## Verification

Run:

```sh
node scripts/audits/audit-phase2124-action-semantic-knowledge-projection-boundary.cjs
node scripts/audits/audit-phase2117-action-judgment-invocation-correlation-interface-first.cjs
```

These are static contract audits. Build, typecheck, and Vitest were not run for this phase.
