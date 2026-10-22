# Phase 2336 — Inherited Controller Policy Closure

## Purpose

Continue the existing effective controller/action policy contract without introducing a parallel authority or a `V2` interface. The canonical Laravel route scanner now passes the already-resolved action's `inheritedFrom` ancestry and the existing controller-action policy evidence catalog to `resolveEffectiveControllerActionPolicy`.

## Changes

- `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`
  - Builds `ControllerPolicyCatalogEntry[]` from the existing `ControllerActionFlowContract` actions and their typed policy sequences.
  - Passes the catalog and the resolved action's `inheritedFrom` list to the existing effective-policy resolver.
  - Continues to use the already-resolved route-controller binding candidate; it does not perform a second controller/action name match.
- `packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts`
  - When an explicit inheritance graph is unavailable, uses the upstream `inheritedFrom` list to retrieve inherited policy evidence from the supplied catalog.
  - Deduplicates repeated policy evidence by source identity while retaining different named middleware declarations from the same source span.
  - Keeps the complete/blocked ADT: blocked policies still do not expose usable middleware/authorization products.
- `packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts`
  - Adds regressions for inherited policy retrieval through the existing ancestry contract and repeated source evidence.
- `packages/core/src/types/upstream/laravelRouteScannerInterface.ts`
  - Advances the scanner contract version from 11 to 12 because effective policy publication now incorporates inherited controller evidence.

## Trace

`LaravelRouteScannerInterface.scan` → controller scan actions → route binding judgment → resolved candidate action → `action.inheritedFrom` + controller policy catalog → existing `resolveEffectiveControllerActionPolicy` → `RouteSemanticFlow.controllerActionPolicy`.

## Constraints preserved

- No `semantic/foundation` dependency was added.
- The effective-policy resolver does not import `semantic/relations` or `semantic/foundation`.
- No parallel `EffectiveControllerActionPolicyV2`, `RouteSemanticFlowV2`, or `LaravelRouteScannerInterfaceV2` was introduced.
- Legacy route scanner/subscanner removal is not claimed by this phase.

## Verification

- Static audit: 12/12 checks passed.
- Audit script syntax: checked with `node --check`.
- ZIP integrity: checked with `unzip -t`.
- Vitest, TypeScript typecheck, and CLI end-to-end were not run. `node_modules` is absent in the supplied source archive; project build was not run.

## Remaining risks

- This phase relies on the upstream `inheritedFrom` list already being complete and correctly ordered. It does not independently prove the controller declaration/inheritance scan is complete.
- The policy catalog is derived from action policy sequences; named middleware is deduplicated by source span and middleware identity, while non-name expression middleware is retained as distinct evidence rather than guessed equivalent.
- End-to-end manifest projection and the remaining `semantic/relations` imports in the broader scanner path remain open.
