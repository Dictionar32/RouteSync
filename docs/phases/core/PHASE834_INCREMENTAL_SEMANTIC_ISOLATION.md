# Phase 834 — Incremental Semantic Isolation

## Objective

Remove the duplicate CLI incremental model/resource/field semantic resolution path from the active production pipeline. The canonical scanner already constructs the validated upstream manifest and semantic source model in Core.

## Changes

- `packages/cli/src/utils/incremental.ts` no longer invokes the legacy `fieldResolver`, `modelAccessorResolver`, `resourceResolver`, or collection canonicalizer.
- The incremental boundary is now a compatibility transport only; model/resource semantic interpretation remains upstream.
- Preserved but emptied legacy incremental semantic implementation files:
  - `fieldResolver.ts`
  - `modelAccessorResolver.ts`
  - `resourceResolver.ts`
  - `collectionCanonicalizer.ts`
- Removed the now-dead `canonicalizeCollectionDescriptor` public CLI export.
- Route legacy helper files from Phase 833 remain preserved and empty.

## Important boundary

This phase intentionally does **not** invent a new CLI model/resource adapter. The remaining CLI command path still calls `resolveManifestIncrementally`; that call is now semantically inert and is the next wiring frontier. The next phase should trace the existing `RouteSyncManifest.sourceModel.contracts` path into the downstream generators and remove the compatibility transport once those consumers are wired to the existing upstream contracts.

## Verification

Run:

`node scripts/audit-phase834-incremental-semantic-isolation.cjs`

The audit must show zero production references/invocations of the preserved semantic helper files and all preserved route/semantic helper files must remain present and 0 bytes.

## Build status

No full TypeScript/Vitest build is claimed when dependencies are not installed. Static source audit is the verification for this checkpoint.
