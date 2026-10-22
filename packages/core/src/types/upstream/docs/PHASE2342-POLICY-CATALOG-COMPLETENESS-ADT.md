# Phase 2342 — Existing policy catalog completeness ADT

## Finding

Phase 2341 improved inherited class-policy lookup, but `policyCatalog: readonly Entry[]` could not encode whether an empty catalog meant “known complete and empty” or “inventory not supplied.” The resolver could therefore silently omit an ancestor policy when `inheritedFrom` was non-empty.

## Existing contract evolved

- `EffectiveControllerActionPolicyUpstreamInput.policyCatalog` now uses the closed `EffectiveControllerActionPolicyCatalogJudgment` ADT: `complete` carries entries; `blocked` carries the typed `controller_policy_inventory_unavailable` reason and controller lineage.
- `EffectiveControllerActionPolicyBlockReason` owns this inventory failure at the effective-policy boundary. It is not misclassified as a controller method-scope parsing failure.
- `resolveEffectiveControllerActionPolicyUpstream` refuses to expose middleware or authorization products when any inherited controller is missing from a supposedly complete catalog, or when the inventory is explicitly blocked.
- The existing source-model boundary now builds the inventory from `SourceModelCatalog.controllers`, rather than passing an empty array for every action.
- The existing Laravel route scanner supplies a `complete` judgment over its controller-action inventory to the injected `EffectiveControllerActionPolicyRuntimeExecutorInterface`.
- The effective-policy authority/executor contract version is 4; the Laravel route scanner contract version is 15.

## Trace

`LaravelControllerScanJudgment.controllers[].actions` → existing `LaravelRouteScannerInterface` → controller-action policy catalog judgment → `effectiveControllerActionPolicyRuntimeExecutor.execute` → `effectiveControllerActionPolicySemanticAuthority.judge` → `resolveEffectiveControllerActionPolicyUpstream` → complete/blocked `EffectiveControllerActionPolicy` ADT → `routeSemanticFlowFromRouteBoundary` → `LaravelSourceAstPipeline` stores `routeScan` and `routeFlows` in the source AST bundle consumed by later compilation/CLI stages.

The source-model route projection independently uses `SourceModelCatalog.controllers` as its inventory source and calls the same upstream resolver. It no longer pretends that a missing inventory is an empty one.

## Semantic scope

Laravel documents controller middleware at class scope and method scope, including `only` / `except` restrictions and inheritance of class-level `WithoutMiddleware` attributes. The resolver therefore inherits only class-scoped controller policy and does not leak a parent's method-only middleware to a child action. See the official Laravel controller documentation linked in the audit summary.

## Verification

- Static contract audit: `scripts/audits/audit-phase2342-policy-catalog-completeness-adt.cjs` — 12/12 PASS.
- `node --check` on the audit script — PASS.
- Added regression test for an inherited controller missing from a supposedly complete inventory.
- TypeScript compilation, Vitest, full CLI execution, and `npm run build` were not run in this environment. Do not treat static checks as a substitute for those tests.

## Remaining work

- Run the focused Vitest tests and a real CLI fixture on the user's supported Arch environment.
- Continue the separate trace of remaining `semantic/relations` imports and the legacy `subscanners/RouteScanner.ts` path; this phase did not remove either because that requires a full caller/export trace and a verified cutover.
- Verify preservation of the blocked/complete policy ADT through manifest and final IR generation with end-to-end tests.
