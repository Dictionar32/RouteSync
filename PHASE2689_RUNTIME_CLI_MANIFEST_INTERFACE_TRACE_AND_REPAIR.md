# Phase 2689 — Runtime CLI → manifest interface trace and repair

## Scope

This phase follows the actual source path in `packages/cli` and `packages/core`; it does not treat `examples/` as runtime proof. The uploaded workspace is a source snapshot without installed dependencies, so the checks below are structural, not a TypeScript build or end-to-end execution claim.

## Root cause found and repaired

`packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts` called `prepareManifestBuilderOperation(...)` directly. That bypassed the explicit `ManifestBuilderOperationPreparationInterface` seam already injected by the CLI composition root. The same file also used `ManifestBuilderJudgment` as a return type without importing it.

Changes:
- The scanner now invokes `manifestBuilderOperationPreparation.prepare(input)` so the runtime path consumes the interface-owned operation.
- Added the missing `ManifestBuilderJudgment` type import.
- Added `scripts/audits/audit-phase2689-runtime-manifest-interface-trace.cjs` to lock down the concrete runtime wiring and semantic boundary.

## Runtime trace

1. CLI command entry points (including drift audit) call `buildManifestWithInvocationPipeline(...)`.
2. `controllerInvocationManifestCompositionAuthority` is built with `canonicalCompositionDependencies`.
3. `canonicalCompositionDependencies.manifestBuilderPreparation` injects `manifestBuilderOperationPreparation`, typed as `ManifestBuilderOperationPreparationInterface`.
4. Source project identity is canonicalized before discovery; source files are discovered/read and identity-bound; invocation judgments are produced and closed into an inventory receipt.
5. The receipt plus explicit `routeSelection` becomes `ManifestBuilderInput`.
6. `manifestBuilderOperationPreparation.prepare(input)` creates the manifest builder operation.
7. `build()` runs the source AST pipeline. AST/ADT-derived evidence is converted into a complete source model; source-AST and source-model failures remain typed `manifest_builder_blocked` judgments rather than being masked.
8. On success, the manifest carries source project identity, AST completion, source model, dataflow inputs/judgments, query-policy contracts, resource-group capabilities, and invocation semantic judgments.
9. `projectRouteSyncManifestFlow` maps the construction manifest to `RouteSyncManifestFlow`; the explicit `RouteSyncManifestFlowProjectionInterface` owns that boundary. The downstream flow exposes semantic contracts, relations, identity/provenance-bearing products and judgments, not the construction AST itself.

## Interface-first declaration forms applied to runtime

- `export interface ManifestBuilderOperationPreparationInterface` — the preparation contract.
- `export function prepareManifestBuilderOperation(input: ManifestBuilderInput): ManifestBuilderInterface` — named operation preparation implementation.
- `export const manifestBuilderOperationPreparation: ManifestBuilderOperationPreparationInterface = ...` — interface-typed runtime dependency.
- `export const projectRouteSyncManifestFlow = (manifest: RouteSyncManifest): RouteSyncManifestFlow => ...` — typed function expression used by the runtime projection.
- `export const routeSyncManifestFlowProjection: RouteSyncManifestFlowProjectionInterface = ...` — explicit projection wiring.

## Structural audit result

`node scripts/audits/audit-phase2689-runtime-manifest-interface-trace.cjs`

**12/12 structural checks passed**, including CLI dependency injection, runtime scanner use of the interface seam, explicit inventory/route-selection input, preservation of typed blocked judgments, and the AST-free projection contract.

## Limits and next source-level work

- TypeScript typecheck, unit tests, package build, and CLI scan/sync E2E were not run because dependencies are not installed in this extracted workspace. The 12/12 result proves only the stated source-structure checks.
- The existing project notes identify a separate production semantic-composition gap: the in-repository diagnostic composition still raises typed producer-gap errors for decision, authority, and integrity. This phase does not claim those semantic producers/verifiers are complete.
- Continue by tracing the actual producer chain for AST/ADT → semantic judgment → inventory/identity, then add behavior tests for blocked and complete outcomes and run typecheck/build/CLI E2E in a dependency-installed environment.
- Laravel route identity must continue to respect actual framework semantics: route groups/prefixes, names, parameters, resource routes and customization. The official docs describe these behaviors in [Laravel Routing 13.x](https://laravel.com/framework/docs/13.x/routing) and [Laravel Controllers 13.x](https://laravel.com/framework/docs/13.x/controllers).
