# Phase 2348 — CLI Route Source Blocker Propagation

## Root cause

The canonical upstream route scanner already owns the closed `LaravelRouteScanOutcome`. When an explicitly selected route source file is absent, `laravelRouteScanner.scan` returns `laravel_route_scan_blocked`, and `LaravelSourceAstProjectionJudgment` preserves that exact judgment. `ManifestBuilderJudgment` then preserves the non-complete projection as `manifest_builder_blocked`, which the CLI can report without reclassifying the failure.

However, both CLI `scan` and `sync` commands performed their own filesystem existence check before invoking the composition root. They threw a generic exception before the upstream scanner contract could produce its typed blocker. This duplicated the existence decision at a downstream layer and bypassed the existing ADT.

## Change

- Removed the selected-route-file preflight exception from `packages/cli/src/commands/scan.ts`.
- Removed the selected-route-file preflight exception from `packages/cli/src/commands/sync.ts`.
- Kept path resolution and explicit source-selection construction in the CLI; these are input wiring, not semantic judgments.
- Missing selected-file classification remains owned by `LaravelRouteScannerInterface.scan` and its existing `LaravelRouteScanBlockedJudgment`.
- The exact blocked judgment flows through `LaravelSourceAstProjectionJudgment` and `ManifestBuilderJudgment` to the existing CLI blocker branches, before manifest, IR, or generator output is written.
- Added `scripts/audits/audit-phase2348-cli-route-source-blocker-propagation.cjs` with 15 structural checks.

## Contract trace

`scan` / `sync` → `buildManifestWithInvocationPipeline` → validated invocation inventory receipt → `ManifestBuilderInterface.build` → `LaravelSourceAstPipelineInterface.execute` → `LaravelRouteScannerInterface.scan` → `LaravelRouteScanBlockedJudgment` → `LaravelSourceAstProjectionJudgment` → `ManifestBuilderJudgment` → CLI blocker reporting.

## Scope and validation

The change evolves the behavior around existing interfaces and ADTs. It adds no second route-scanner contract and no `semantic/foundation` dependency. The new static audit passes 15/15 checks. Type-check, Vitest, CLI end-to-end, and build were not run; `npm run build` was intentionally not run.
