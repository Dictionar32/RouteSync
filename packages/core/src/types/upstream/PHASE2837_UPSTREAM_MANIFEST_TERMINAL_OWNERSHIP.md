# Phase 2837 — Upstream Manifest Terminal Ownership

## Root cause

Phase 2836 removed `switch` from the drift continuation but retained a central downstream dispatcher and a CLI `ControllerInvocationManifestCompositionReasoningContract` whose workflow was declarative data rather than executable domain behavior. The consumer still had to submit a seven-way handler table to an external dispatcher. That changed syntax, not ownership.

## Contract correction

- Removed `ControllerInvocationManifestCompositionReasoningContract` and its exported runtime constant. Workflow descriptions are not treated as a substitute for executable operations.
- Each `ControllerInvocationManifest` terminal is now an operation-bearing ADT arm with `continueForDriftAudit(handlers)`.
- The producer binds the terminal's domain operation when creating the result. The consumer invokes the operation on the result itself; it does not dispatch on `kind`.
- Core `ManifestBuilderJudgment` remains the owner of generic manifest construction outcomes. The CLI composition boundary adapts those two upstream outcomes to CLI-specific drift-audit terminal operations; drift-specific behavior is not pushed into the generic core manifest builder.
- Existing upstream source identity, discovery, source document reader/binding, semantic pipeline/delivery, inventory closure, and manifest builder contracts are reused. No parallel core contract was introduced.
- `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes).

## Runtime trace

`driftAuditor.auditManifestDrift` → `controllerInvocationManifestBuilder.build` → `routeSyncCliManifestScanOperationFactory.scan` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → canonical project identity → source discovery → source document read and identity binding → semantic pipeline and delivery → invocation judgment authority → inventory closure authority → manifest builder → producer binds `continueForDriftAudit` to the terminal ADT value → drift auditor invokes `freshManifest.continueForDriftAudit(...)`.

Terminal behavior is explicit and distinct: complete manifests proceed to route comparison; blocked manifest construction, inventory rejection, discovery failure, project identity failure, document read failure, and source identity rejection each take their own failure action. A failure cannot be interpreted as a complete manifest.

## Verification boundary

`scripts/audits/audit-phase2837-upstream-manifest-terminal-ownership.cjs` checks contract ownership, terminal operation binding, consumer use, no central dispatcher, explicit barrel exports, no `switch` in the composition module, and the empty collections file. These are structural assertions only. They do not establish full TypeScript typecheck, package build, test-suite success, or CLI end-to-end behavior.
