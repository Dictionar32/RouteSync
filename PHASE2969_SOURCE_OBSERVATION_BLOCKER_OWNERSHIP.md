# Phase2969 — Source Observation Blocker Ownership

## Scope

This phase continues the existing Phase2967 trace and Phase2968 source-observation continuation work. It changes the source-selection ADT so the blocked explicit-source variant owns the transition to a blocked route-scan outcome. The scanner no longer supplies an `onBlocked` callback that merely forwards the blocked observation back to `laravelRouteScanOutcomeOperations`.

## Runtime transition

- Ready observation: `continueToRouteScan` delegates to the explicitly typed `scanReadyObservation` capability. The scanner owns source reading, source-read batch folding, route parsing, and semantic composition.
- Explicitly selected missing source: the blocked observation's own `continueToRouteScan` operation creates the `sourceSelectionBlocked` route-scan outcome while preserving the original `missingFiles` inventory. It does not ask the caller to classify the blocker again.
- Default conventional source absence remains optional only under the default selection intent; this change does not convert explicit missing files into an empty success.

## Files changed

- `packages/core/src/types/upstream/laravelRouteSourceSelection.ts`
  - Replaced the two-handler `{ onReady, onBlocked }` continuation with the ready-only `scanReadyObservation` capability.
  - The blocked variant now owns `sourceSelectionBlocked` outcome construction.
- `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`
  - Removed consumer-owned `onBlocked` forwarding; only the ready source-scan capability remains at this transition.
- `scripts/audits/audit-phase2967-typed-runtime-upstream-cli-manifest.cjs`
  - Added structural checks for blocker ownership and ready-only continuation.
- `package.json`
  - Added `audit:phase2969-source-observation-blocker-ownership`.

## Verification

Structural audit: **12/12 checks passed** via `node scripts/audits/audit-phase2967-typed-runtime-upstream-cli-manifest.cjs`.

Full TypeScript typecheck, tests, build, and CLI end-to-end were not run: this extracted workspace has no local `node_modules`, and prior workspace verification recorded missing `@types/node` / `vitest/globals` and a global TypeScript version that does not match the configured ES2025 target/lib. Do not treat the structural audit as proof of compilation or runtime correctness.

## Remaining upstream work

1. `SourceFileInventory` still exposes materialization and callback-shaped traversal; migrate only traced source-reading consumers to a justified domain operation, preserving ordering and duplicate identity evidence.
2. `ManifestBuilderJudgment.continueToFlow(projection)` still uses a shared method shape for complete and blocked variants; consider more precise publish/preserve operations without introducing a parallel generic result type.
3. The repository still contains many exported functions for internal helpers and non-route runtime subsystems. Do not mechanically rewrite them. Continue classifying exports along the actual upstream → CLI → manifest runtime path and migrate only true runtime entrypoints to explicitly typed object interfaces.
4. The ready source-scan capability still delegates actual source reading and parsing to the scanner. This phase removes consumer-owned blocked-result dispatch; it does not claim the entire scanner is free of callback protocols or primitive control flow.

## Invariants retained

- Explicit missing source evidence remains a blocker.
- Optional default absence remains distinct from explicit selection failure.
- Source-read failure evidence remains blocked rather than becoming an empty successful manifest.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- No generic `Result`, generic collection abstraction, or mechanical deletion of lexical control flow was introduced.
