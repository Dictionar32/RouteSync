# Phase 2154 — Canonical Action Judgment Publication and Route Boundary Wiring

## Goal

Publish the existing per-action semantic judgment through the controller scan artifact and consume its request ADT at the existing route boundary. This phase evolves existing contracts and wiring; it does not add another semantic authority, `relation/foundation`, or a subscanner.

## Source trace

1. `LaravelControllerScannerExecutor` calls the existing `actionJudgment.judge(...)` and passes the exact judgment to `actionExecution.execute(...)`.
2. Each controller artifact now publishes `actionJudgments`, a source-correlated publication retaining the complete judgment value and a stable upstream view of its projection identity.
3. `laravelRouteScanner` correlates controller-reference route targets with published judgments by exact controller/action identity. Correlation is a closed ADT: matched, unmatched, or ambiguous.
4. `routeProducerRelations.ts` projects the canonical request judgment into the existing `RouteRequestBinding` ADT.
5. The existing endpoint projection preserves `typed_request` as `inline_input` and `unresolved_request` as `unresolved_input`; FormRequest and framework request variants remain explicit.
6. The existing `RouteControllerBindingJudgmentAuthority` still owns resolved/unresolved/ambiguous route-target outcomes. Route scanner matching is identity correlation, not a competing semantic authority.

## Contract changes

- `LaravelControllerScanArtifact` now includes `actionJudgments`.
- Controller scan contract version advances to 32.
- Route scanner contract version advances to 4 because its controller artifact input now carries canonical action judgments.
- `ControllerActionJudgmentRouteSelection` makes no-match and ambiguity explicit rather than hiding them in an optional judgment.
- The typed request projection-loss obligation is removed from the open derivation list because the canonical request ADT is now projected for uniquely correlated action judgments. Unmatched/ambiguous correlation becomes `unresolved_action_request` and then `unresolved_action_input`; it is not flattened to `no_request` / `no_input`. The request-type solver explicitly excludes this unresolved action-binding outcome from FormRequest aggregation. Other legacy derivation/publication obligations remain open.

## Limits

The action judgment authority still delegates derivation through the legacy action adapter; this phase does not claim to retire it. Full build, full typecheck, and Vitest were not run. Static audit and syntax-only TypeScript transpilation do not prove whole-project type correctness.
