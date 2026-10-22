# Phase 2346 — Route Policy Blocked Publication Gate

## Root cause

Phase 2345 preserved `controller_policy_inventory_unavailable` in the canonical `ControllerActionPolicyRelation`, but the scanner still returned `laravel_route_scan_judgment` regardless of whether a route's `EffectiveControllerActionPolicy` was blocked. The source-AST pipeline therefore mapped the route artifacts into `SourceAsts`, passed `validateCompleteSourceAst`, and allowed the manifest builder / CLI to publish a manifest whose route policy was explicitly blocked.

That is a contract-flow gap: a closed blocked ADT existed upstream, but the route scanner outcome did not expose that blocker to the existing source-AST publication gate.

## Change

- Evolved the existing `LaravelRouteScanOutcome` with `laravel_route_scan_policy_blocked`; it retains the complete route scan and the exact blocked policy judgments correlated with route ASTs.
- Evolved the existing `LaravelRouteScannerInterface` / route scan judgment contract version from 16 to 17.
- Evolved the existing `LaravelSourceAstProjectionJudgment` with `laravel_source_ast_projection_route_policy_blocked`, preserving the exact route scanner judgment and invocation inventory receipt.
- The source-AST pipeline stops before constructing/publishing `SourceAsts` when any route has a blocked effective controller-action policy. The existing manifest builder already preserves every non-complete source-AST projection as `manifest_builder_blocked`, and CLI `scan` already stops on that outcome.
- Exported the existing route-policy-blocked outcome type through the core package entry point.

## Trace

`LaravelControllerScannerInterface` inventory → `LaravelRouteScannerInterface.scan` → existing `EffectiveControllerActionPolicyRuntimeExecutorInterface.execute` → exact complete/blocked `EffectiveControllerActionPolicy` → `LaravelRouteScanPolicyBlockedJudgment` → `LaravelSourceAstProjectionJudgment` → existing `ManifestBuilderJudgment` → CLI `scan`/`sync` blocker.

The scanner only transports the existing blocked policy variant; it does not reconstruct the policy, synthesize middleware/authorization products, or create a second semantic authority. No `semantic/foundation` import or new dependency was added.

## Validation

The phase audit checks contract wiring, exact blocked-policy preservation, source-AST short-circuit, manifest publication gate compatibility, CLI blocked branch compatibility, and prohibited imports. Static checks are not a substitute for Vitest/type-check or CLI end-to-end execution; those were not run in this environment. `npm run build` was not run.
