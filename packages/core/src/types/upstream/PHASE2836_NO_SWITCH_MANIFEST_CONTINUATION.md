# Phase 2836 — No-Switch Manifest Continuation

## Change

Removed `switch` dispatch from the active CLI manifest composition runtime in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`.

- `closeInventory` now narrows validated and rejected inventory judgments with explicit discriminant checks, then uses a `never` exhaustiveness guard.
- `controllerInvocationManifestDriftAuditContinuation.continueForDriftAudit` now routes all seven terminal manifest judgments through explicit typed discriminant checks and named domain handlers, followed by a `never` exhaustiveness guard.
- The runtime remains interface-first (`export const ...: Interface = Object.freeze({...})`).
- The Phase 2835 audit now verifies that this runtime composition module contains no `switch` statement and verifies the explicit domain routes.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`driftAuditor.auditManifestDrift` → `controllerInvocationManifestBuilder.build` → CLI scan operation → composition authority → identity canonicalization → source discovery/read/binding → semantic pipeline and delivery → inventory closure → manifest builder → `continueForDriftAudit` → terminal-specific audit action.

## Verification boundary

`node scripts/audits/audit-phase2835-manifest-drift-domain-continuation.cjs` passes 17/17 structural checks. This is not a claim of full TypeScript typecheck, build, or end-to-end success.
