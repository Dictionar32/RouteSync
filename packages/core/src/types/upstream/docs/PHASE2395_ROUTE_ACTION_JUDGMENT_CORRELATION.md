# RouteSync Phase 2395 — Route Action Judgment Correlation

## Objective

Audit and correct the route-boundary producer's handling of the existing `StandardRouteTarget` ADT so controller-action targets use the canonical upstream `ControllerActionRouteCorrelationAuthorityInterface` instead of being treated as unmatched by default.

## Root cause

`actionJudgmentForTarget` previously grouped `controller_action` and `closure` in one branch and returned `unmatched_action_judgment` for both. That erased the distinction between a controller action with a canonical identity and a closure that has no controller invocation identity. The repository already has a correlation authority that validates publication identity, source-file/span coherence, and ambiguity; the `controller_action` case was not delegating to it.

## Change

In `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`:

- `controller_action` now delegates to `controllerActionRouteCorrelationAuthority.judge(...)` using the existing `target.action.controllerName` and `target.action.actionName` identities.
- `controller_reference` continues to use the same authority.
- `closure` remains `unmatched_action_judgment`, because a closure is not a controller action.
- The returned selection continues into `routeBoundaryContractFromRouteFacts(...)`; no new judgment type or parallel authority was introduced.

## Validation

- Phase 2395 focused audit: 6/6 assertions passed.
- Phase 2394 operation-contract audit: 10/10 assertions passed.
- Historical route audits Phase 2380–2395: all executed without failure.
- No package build, Vitest suite, full TypeScript typecheck, or CLI end-to-end run was performed in this phase.

## Scope limitation

The current resource emitter is invoked with `relationNone()` for its legacy `controllerMap`, so resource declarations currently tend to produce `controller_reference` rather than `controller_action`. The corrected branch is still required for the closed target ADT and any producer of the `controller_action` variant, but this phase does not claim to have activated that variant in the current scanner wiring. The wider route producer implementation still resides under `subscanners/routeProducerRelations.ts`, continues to use `semantic/relations`, and the full Invocation Semantic Judgment → Integrated Response → Runtime Executor → Manifest → CLI chain remains unverified end-to-end.

## Status

A real correlation defect in the target ADT consumer was corrected using the existing upstream authority. This is a bounded closure, not a declaration that the entire interface-first migration is complete.
