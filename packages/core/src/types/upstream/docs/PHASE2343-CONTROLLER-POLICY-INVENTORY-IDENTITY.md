# Phase 2343 — Existing Controller Policy Inventory Identity

## Root cause

Phase 2342 made policy-catalog completeness explicit, but the catalog could still only express a whole-catalog `complete` or `blocked` judgment. A single controller whose policy inventory was unavailable could therefore make unrelated inherited policy look unavailable too. In addition, `LaravelControllerScanArtifact` did not retain the controller identity independently of its action list, so a controller declaration with no published actions could not be named as an unavailable inventory.

## Existing contracts evolved

- `EffectiveControllerActionPolicyCatalogJudgment` keeps the existing closed ADT and now preserves known `entries` in its `blocked` arm. Its reason names only controller inventories that are unavailable.
- The existing policy resolver checks unavailability against the concrete `inheritedFrom` lineage. A blocked inventory for an unrelated controller no longer blocks a policy judgment when the actual ancestor's inventory is known.
- `LaravelControllerScanArtifact` now carries its canonical `identity: ControllerName` independently from `actions`; the existing controller scanner publishes it from the declaration name. The controller scanner contract advances from 42 to 43.
- The existing Laravel route scanner builds its policy catalog from the complete controller scan artifact inventory. Controllers with no published actions are explicitly listed as unavailable while known controller entries remain available to the executor.
- The existing `EffectiveControllerActionPolicyRuntimeExecutorInterface` remains the scanner's injected execution boundary. No parallel authority or V2 interface was introduced.

## Trace

`LaravelControllerScanJudgment.controllers[].identity/actions` → `LaravelRouteScannerInterface.scan` → existing controller policy catalog judgment (`complete` or `blocked` with known entries) → `EffectiveControllerActionPolicyRuntimeExecutorInterface.execute` → `EffectiveControllerActionPolicySemanticAuthorityInterface.judge` → `resolveEffectiveControllerActionPolicyUpstream` → complete/blocked `EffectiveControllerActionPolicy` → route flow projection → `LaravelSourceAstPipeline` retains `routeScan` and `routeFlows`.

## Regression coverage

Static audit covers the changed contracts and wiring. A regression case verifies that an unrelated unavailable controller does not block inheritance from a known parent. The existing regression still verifies that an ancestor missing from a catalog declared complete blocks the result.

## Not claimed

This phase does not retire `subscanners/RouteScanner.ts`, remove remaining `semantic/relations` imports, or prove CLI/manifest end-to-end preservation. Vitest and TypeScript type-checking were not run because dependencies are not installed in this extracted archive; `npm run build` was not run.
