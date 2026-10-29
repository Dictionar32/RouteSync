# Phase 2864 — Fully Typed Runtime Scanner Operations

## Runtime trace: CLI manifest

`CLI scan/sync` → `RouteSyncCliUpstreamCompositionInterface.manifestScanOperation.scan(input)` → `routeSyncCliManifestScanOperationFactory` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → canonical source discovery and identity binding → controller invocation inventory judgment → `ControllerInvocationManifest.continueForDriftAudit(handlers)` → CLI projection/output.

The existing manifest judgment already owns `continueForDriftAudit`; this phase preserves that established upstream contract and does not add a redundant manifest wrapper.

## Concrete runtime migration

The route middleware scope decision previously exposed `middlewareScopeApplicability(...): boolean` and the runtime resolver independently repeated scope applicability logic. The boolean helper is no longer exported. The contract now lives in `packages/core/src/types/upstream/routeMiddleware.ts`:

- `RouteMiddlewareScopeApplicabilityJudgment` exposes `continueWith`.
- `RouteMiddlewareScopeNotApplicableJudgment` distinguishes blocked scope, missing concrete action, excluded action, and action outside an `only` scope.
- `RouteMiddlewareScopeApplicabilityAuthorityInterface` names the runtime authority contract.

The implementation is exported interface-first as `routeMiddlewareScopeApplicabilityAuthority: RouteMiddlewareScopeApplicabilityAuthorityInterface = Object.freeze({...})`. The runtime `routeMiddlewareFlowResolver.resolve` consumes this authority for both declarations and exclusions. It collects applicable declarations through continuation handlers rather than calling a boolean `scopeApplies` helper.

Example:

```ts
const decision = routeMiddlewareScopeApplicabilityAuthority.classify(scope, action);
return decision.continueWith({
  onApplicable: (_scope, _action) => [declaration],
  onNotApplicable: judgment => {
    // Forward the explicit domain judgment to a diagnostics/trace owner.
    return [];
  },
});
```

## Audit boundaries

The audit checks the CLI manifest operation contract, scan/sync call sites, the existing manifest continuation, the new upstream middleware ADT, its use by the runtime resolver, absence of `export function` on the production scan/upstream/CLI path, absence of relation imports in CLI, and the zero-byte `collections.ts` invariant.

The audit does not claim all callable const exports have been migrated. It also does not claim all `semantic/relations` imports have been removed; the audit JSON lists remaining import files.

## Verification

- Structural audit: run `npm run audit:phase2864-fully-typed-runtime-scanner-operations`.
- TypeScript syntax transpilation succeeded for the changed production files and new test.
- A targeted `tsc` invocation reported no errors in the changed production files; it remains nonzero because this snapshot does not include Vitest declarations for the test file.
- Full typecheck, Vitest, package build, and CLI E2E are not claimed as passing.
