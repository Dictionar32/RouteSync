# Phase2931 — Explicit Source Observation Continuations

## Scope

This phase continues Phase2930 by removing effect-only traversal methods from the Laravel source-selection ADT, centralizing source identity comparison through the existing `laravelSourceIdentitySemantics`, and exposing explicit continuation operations for ready and blocked observation judgments.

## Runtime trace

`LaravelRouteScannerInterface.prepare` → `LaravelRouteDeclarationCompositionAuthorityInterface.resolveSourceFiles` → `LaravelRouteSourceSelectionIntent.resolveFilesFor` → `observeSourceFiles` → `LaravelRouteSourceSelectionIntent.observeFiles` → ready/blocked observation judgment → scannable/missing `SourceFileInventory` → scanner read/parse → route artifacts → scan outcome → manifest composition.

## Changes

- `LaravelRouteSourceObservationReadyOperations.continueWithScannableSources()` returns the canonical scannable inventory instead of accepting a visitor and returning `void`.
- `LaravelRouteScanBlockedJudgment.preserveMissingSourceEvidence()` returns the original missing-source inventory; blocked evidence is not transformed into an empty successful read plan.
- `ExplicitRouteSourceSelectionOperations.selectedSourceFiles()` exposes the selected inventory directly instead of a visitor operation returning `void`.
- Source matching uses `laravelSourceIdentitySemantics.relateSourceFiles`; the route-selection implementation no longer compares raw `file.value.value` strings.
- Optional-default absence is classified using a filtered missing-source inventory's ADT variant, not `countMatching(...) > 0`.
- Ready/blocked judgments expose direct domain operations for obtaining the scannable inventory or preserving missing-source evidence. A handler-wrapper was deliberately not retained because it would merely wrap the same discriminated union.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Remaining boundary

`SourceFileInventoryVisitorInterface.visit` and `SourceFileInventoryOperations.visitSources` remain low-level effectful traversal contracts returning `void`. This phase removes `void` from the route-source-selection operations, but does **not** claim that all low-level inventory traversal is fully explicit. A follow-up must model traversal results without introducing a generic collection/visitor abstraction or fake no-op outcomes. The scanner still uses an explicit ready/blocked branch; the scanner still uses an explicit ready/blocked branch rather than dispatching through the ADT's domain operations alone.

## Validation

The structural audit scripts are run for Phase2929 and Phase2930, plus the new Phase2931 audit. Typecheck, Vitest, build, and CLI E2E are only reported if executed successfully in an environment with dependencies installed.
