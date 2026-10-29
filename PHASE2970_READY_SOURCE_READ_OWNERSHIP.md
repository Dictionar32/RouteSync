# Phase2970 — Fully Explicit Typed Runtime Scanner: Ready Source Read Ownership

## Objective

Raise the source-observation decision into the upstream ADT so a ready observation owns the legal transition from classified source inventory to source-read batch. Do not restore or depend on the deleted relation-foundation modules (`semantic/relations/relationMembership`, `relationalSequence`, or `semanticRelations`) and do not create a renamed generic replacement.

## Runtime trace: Laravel source → upstream → CLI → manifest

1. CLI `scan` / `sync` uses `routeSyncCliUpstreamCompositionFactory` to assemble the upstream pipeline.
2. `routeSyncManifestScanOperationFactory` and `routeSyncManifestScanner` expose the CLI-facing manifest operation through explicitly typed runtime objects.
3. `manifestBuilderOperationPreparation` delegates source AST acquisition to `laravelSourceAstPipelineFactory` and preserves blocked outcomes rather than publishing an empty manifest.
4. `laravelRouteScannerFactory` resolves the route-source selection intent and observes selected versus missing files.
5. **New in Phase2970:** `LaravelRouteSourceObservationJudgment.continueToRouteScan(reader, continuation)` owns source-read orchestration for the ready variant. It reads only `readPlan.toSourceFiles()`, creates `PhpSourceDocumentReadBatchJudgment` through the existing source-read batch factory, and passes the typed batch to the scanner's continuation.
6. The scanner consumes the typed read-batch outcome. A read batch with blockers remains `laravel_route_scan_source_read_blocked`; a complete batch proceeds to Laravel route declaration parsing, declaration composition, route AST production, binding and semantic flow projection.
7. `LaravelRouteScanOutcome` continues to own its AST projection transition, and the manifest builder only publishes complete upstream evidence.

## Domain invariants

- An explicitly selected route source that is missing remains a blocked source-selection outcome with its exact missing-file inventory.
- A missing conventional/default route file remains distinct from an explicitly selected missing file and can be represented as optional absence under default intent.
- The ready observation can only read its own scannable inventory; callers no longer repeat the reader mapping and batch-factory step.
- The blocked observation does not read files and does not invoke the ready continuation. It preserves the blocker through `laravelRouteScanOutcomeOperations.sourceSelectionBlocked`.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- No deleted relation foundation was restored or imported by the traced runtime path.

## Interface-first runtime exports

The audited entrypoints continue to use explicit interface-typed object exports, including:

- `routeSyncCliUpstreamCompositionFactory`
- `routeSyncManifestScanOperationFactory`
- `routeSyncManifestScanner`
- `manifestBuilderOperationPreparation`
- `laravelSourceAstPipelineFactory`
- `laravelRouteScannerFactory`
- `laravelRouteScanOutcomeOperations`

This is a bounded runtime-path audit, not a claim that every exported function across the repository has been migrated. Pure helpers and lexical mechanics should not be rewritten mechanically; domain decisions should move into typed ADT operations where there is a meaningful domain contract.

## Laravel source-model grounding

Laravel's official routing documentation describes route files under `routes/`, route declarations using HTTP methods, controller-action arrays, named routes, and route parameters. Those are distinct syntax/domain forms the scanner must preserve as source evidence rather than flatten into a generic relation abstraction. Official references: [Laravel Routing](https://laravel.com/framework/docs/routing) and [Laravel Controllers](https://laravel.com/framework/docs/12.x/controllers).

## Verification

- Phase2967 trace audit: **12/12 structural checks passed** after updating it to assert reader-to-scan ownership.
- Phase2970 audit: **13/13 structural checks passed**.
- `node --check` is run on the new audit script.
- Full typecheck, unit tests, build, and CLI end-to-end remain **unverified** in this workspace; `node_modules` is absent here.

## Explicit build blocker not hidden by this phase

The uploaded `build.log` reports 230 unresolved-import errors starting with references to the deleted `semantic/relations` modules. A repository search finds references to those deleted paths in 276 files. Phase2970 does **not** restore those modules, use the kernel re-exports that point back to them, or create a replacement foundation under another name. The remaining consumer migration must be done as domain-specific operations and existing ADTs, in bounded groups, before the project build can be expected to pass. Therefore, the passing structural audits do not mean the package build is green.
