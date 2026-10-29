# Phase2971 — Source Presence Is Domain-Owned

## Scope

This phase continues the Fully Explicit Typed Runtime Scanner Operations work from Phase2970. It moves the decision about source-file presence out of `laravelRouteScannerFactory.prepare` and into the source-selection ADT, without restoring or re-exporting the deleted relation foundation.

## What changed

- Added `LaravelRouteSourcePresenceInterface` as the typed filesystem-boundary capability.
- Changed `LaravelRouteSourceSelectionIntentOperations.observeFiles` to receive the presence capability rather than a precomputed `missingFiles` inventory.
- The default source-selection variant now classifies absent conventional route files as `laravel_route_source_file_absent_optional_default` and excludes them from the read plan.
- The explicit source-selection variant derives the exact missing-file inventory itself. If a selected file is absent, it returns the existing `laravel_route_scan_blocked` ADT and preserves that inventory.
- `laravelRouteScannerFactory` now supplies the low-level filesystem observation capability. It no longer computes `selectedFiles.filter(file => !fs.existsSync(...))` or decides the meaning of absence.
- `routeDeclarationCompositionAuthority` forwards the typed presence capability into the intent ADT.
- Updated source-selection tests to use the current `continueToRouteScan` domain operation rather than the retired callback shape.

## Runtime trace

`CLI scan/sync` → `RouteSyncCliUpstreamCompositionFactory` → `ManifestBuilderOperationPreparation` → `LaravelSourceAstPipeline` → `LaravelRouteScannerFactory.prepare` → `LaravelRouteSourceSelectionIntent.resolveFilesFor` → filesystem presence capability → `LaravelRouteSourceSelectionIntent.observeFiles` → ready / explicit-source-blocked ADT → ready ADT reads its scannable inventory → `PhpSourceDocumentReadBatchJudgment` → route declaration AST and semantic flow → `LaravelRouteScanOutcome` → source-AST projection → source-model build → `ManifestBuilderJudgment` → manifest flow projection.

The key boundary is that the filesystem adapter reports whether a selected path exists; the source-selection ADT owns what that fact means under the user's selection intent.

## Invariants preserved

- A missing conventional/default route source is represented as optional absence and is not read.
- A missing explicitly selected source is a blocker with the exact missing-file inventory; it is not converted into an empty successful scan.
- A file that exists but cannot be read still flows through the source-reader result and read-batch blocker path.
- The ready source-observation ADT continues to own source reading and typed read-batch creation.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- No deleted `semantic/relations/{relationMembership,relationalSequence,semanticRelations}` module was restored or re-exported, and no renamed generic relation foundation was introduced.

## Runtime export contract

The audited runtime entrypoints remain interface-typed object exports, including `routeSyncCliUpstreamCompositionFactory`, `routeSyncManifestScanOperationFactory`, `routeSyncManifestScanner`, `manifestBuilderOperationPreparation`, `laravelSourceAstPipelineFactory`, and `laravelRouteScannerFactory`. This phase does not mechanically rewrite pure helper functions outside the runtime entrypoint path.

## Laravel grounding

Laravel's routing documentation describes conventional route files under `routes/`, their loading configuration, and route declaration forms such as HTTP-method routes and controller actions. The scanner should preserve these source forms as evidence. Reference: [Laravel Routing](https://laravel.com/framework/docs/routing).

## Verification

- `audit:phase2971-source-presence-domain-ownership`: **12/12 structural checks passed**.
- Phase2970 runtime scanner audit: **13/13 structural checks passed**.
- Phase2967 upstream/CLI/manifest trace audit: **12/12 structural checks passed**.
- Audit script syntax check: passed.
- Unit tests and full build: **not verified** because `node_modules` is absent (`turbo: not found` when attempting the targeted test command).

## Remaining blocker — not hidden

The repository still contains **517 references in 274 TypeScript files** to the deleted relation-foundation paths. This phase deliberately does not restore those modules, use kernel re-exports that point back to them, or create a replacement foundation under another name. The broader consumer migration remains outstanding, so the full package build is not claimed to be green.
