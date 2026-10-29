# Phase2921 — Fully Typed Runtime Scanner Operations

## Change

Removed `SourceFileInventory.continueWith<Result>` from the upstream source-file inventory ADT. The inventory now exposes `visitSources(visitor)` through `SourceFileInventoryVisitorInterface`, a domain-specific operation that does not return a generic result and does not depend on CLI settlement types.

The CLI manifest composition schedules source-document reads by visiting the inventory. Promise creation follows inventory order; `Promise.all` preserves that scheduled order in the returned read settlements. The inventory formatter also traverses via the visitor operation.

## Manifest trace

`CLI scan/sync` → injected manifest scan operation → `ControllerInvocationManifestCompositionAuthority` → source project identity canonicalization → controller source discovery → `SourceFileInventory` → `visitSources` → source document reads → identity binding → semantic judgment preparation → inventory closure → manifest builder judgment → manifest terminal / drift audit.

## Contract and runtime conventions

- Runtime operations retain `export const operation: ExistingInterface = Object.freeze({...})` where applicable.
- SourceFileInventory has domain operations (`include`, `filter`, `countMatching`, `format`, `visitSources`) rather than generic continuation handlers.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- The phase does not mechanically rewrite the adjacent route selection, route scanner, controller ambiguity, or DTO discovery contracts; their distinct domain evidence and blockers remain documented in the Phase2920 trace.

## Validation

Structural audits passed: Phase2916 19/19, Phase2917 16/16, Phase2918 19/19, Phase2919 18/18, Phase2920 12/12, Phase2921 13/13 (97/97 total). TypeScript `transpileModule` syntax checks passed for the three modified production modules and the new focused test (0 syntax diagnostics each). ZIP integrity is checked separately.

The focused Vitest test was added but not executed because dependencies / `node_modules` are not installed in this extracted workspace. Full typecheck, build, unit-test execution, and CLI E2E are not claimed.
