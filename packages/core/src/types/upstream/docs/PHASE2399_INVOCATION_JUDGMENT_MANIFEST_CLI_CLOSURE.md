# RouteSync Phase 2399 — Invocation Judgment Manifest/CLI Closure

## Audit and trace

The validated invocation inventory receipt already contains one source-correlated `LaravelControllerInvocationSemanticJudgmentInterface` per discovered controller source. Each judgment retains its exact `response` ADT, including complete, blocked, source-binding-rejected, and not-connected outcomes.

The concrete manifest retained the receipt under `manifest.ast.ast.controllerInvocationSemanticInventory`, but `routeSyncManifestFlowProjection` previously omitted that judgment set. Consequently, the AST-free downstream flow and CLI consumers could not access the canonical invocation judgment without returning to the construction AST or reconstructing it from controller artifacts.

## Root cause

The semantic judgment existed upstream and was preserved in the concrete manifest, but the manifest-flow contract projected only contracts, relations, dataflow products, and resource-group capabilities. This was a manifest boundary omission, not a missing invocation authority or a reason to create another judgment type.

## Change

- Extended the existing `RouteSyncManifestFlow` with `invocationSemanticJudgments`, typed as the existing `LaravelControllerInvocationSemanticJudgmentInterface` ADT.
- The flow projection forwards `manifest.ast.ast.controllerInvocationSemanticInventory.correspondences` exactly. It does not derive judgments from controller ASTs or classify response outcomes.
- The `scan` and `sync` CLI paths now emit an additive `routesync.invocations.json` artifact containing the forwarded judgment set.
- Existing manifest, graph, dataflow, IR, and generator outputs are unchanged.
- No new semantic interface family and no `semantic/foundation` dependency were introduced.

## Verification

Run `node scripts/audits/audit-phase2399-invocation-judgment-manifest-cli-closure.cjs`.

This is a structural source audit. Full TypeScript typecheck, Vitest, package build, and live CLI execution are not claimed as completed by this phase.

## Remaining work

- Execute `scan` and `sync` against a real Laravel fixture and verify `routesync.invocations.json` preserves all four outcome variants and source identity.
- Run focused TypeScript and regression tests in the supported local environment.
- Continue the separate route scanner ownership/subscanner and `semantic/relations` audit.
