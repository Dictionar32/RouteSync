# Phase 2344 — Controller Policy Inventory Contract

## Finding

Phase 2343 gave each existing `LaravelControllerScanArtifact` a canonical controller identity, but the route scanner still inferred policy-inventory availability from `controller.actions.length === 0`. That inference was semantically unsound: action publication and class-level policy inventory are different facts. A complete declaration scan can know class-level middleware/authorization even when it publishes no action.

## Existing contracts evolved

- `LaravelControllerScanArtifact` now carries `policyInventory`, the controller-level policy facts derived from declaration evidence.
- `controllerPolicyInventoryFromDeclaration` reuses the existing policy projection for class attributes and `HasMiddleware`; it does not create a second policy authority.
- `laravelRouteScanner` builds each existing `EffectiveControllerActionPolicyCatalogEntry` from the controller-level inventory plus action policy facts.
- A `laravel_controller_scan_complete` judgment is the completeness proof for this inventory. The scanner no longer declares a controller unavailable merely because `actions` is empty.
- Controller scanner contract version advances to 44. Laravel route scanner contract version advances to 16. Existing policy authority/executor contracts remain version 4.

## Trace

`LaravelControllerScanJudgment.controllers[].policyInventory` → `LaravelRouteScannerInterface.scan` → `EffectiveControllerActionPolicyCatalogJudgment` → existing `EffectiveControllerActionPolicyRuntimeExecutorInterface.execute` → existing upstream authority → `RouteSemanticFlow.controllerActionPolicy` → `SourceAsts.routeFlows` and `routeScan` → `constructRouteSyncManifest`.

The manifest builder already preserves a blocked source-AST projection as `manifest_builder_blocked`; this phase does not invent a second outcome channel or duplicate the policy judgment in `LaravelRouteScanArtifact`.

## Official references

Laravel documents class-level controller middleware and method-specific `only`/`except` policy. The source model must therefore preserve controller-level policy independently from which actions are published. TypeScript's official handbook recommends discriminated unions for representing distinct semantic outcomes and exhaustive narrowing.

- https://laravel.com/framework/docs/13.x/controllers
- https://www.typescriptlang.org/docs/handbook/2/narrowing

## Verification limits

- Static contract audit: 12 checks.
- `node --check` for the audit script: run separately.
- Vitest, TypeScript type-check, and CLI end-to-end execution were not run in this extracted source archive.
- `npm run build` was not run.
- Remaining `semantic/relations` imports and the legacy `subscanners/RouteScanner.ts` caller/export graph remain separate follow-up work; neither was deleted or hidden by this phase.
