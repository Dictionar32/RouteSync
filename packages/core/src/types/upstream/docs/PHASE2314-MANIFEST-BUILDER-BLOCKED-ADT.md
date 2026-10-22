# Phase 2314 — Manifest Builder Blocked ADT

## Audit finding

Phase 2313 made `LaravelSourceAstPipelineInterface.execute` return a closed `LaravelSourceAstProjectionJudgment`, but `constructRouteSyncManifest` still converted every non-complete projection into a thrown `Error`. The upstream manifest boundary therefore discarded the typed blocker and forced CLI callers to interpret an exception instead of an upstream judgment.

## Contract correction

`ManifestBuilderInterface.build` now returns `ManifestBuilderJudgment`:

- `manifest_builder_complete` carries the canonical `RouteSyncManifest`.
- `manifest_builder_blocked` carries the source-project identity and the exact non-complete `LaravelSourceAstProjectionJudgment`.

The contract version advances from 3 to 4. The builder returns the blocked judgment before source-model construction and creates a manifest only from `laravel_source_ast_projection_complete`.

## Trace

`CLI scan/sync/drift audit` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → `ManifestBuilderInterface.build` → `LaravelSourceAstPipelineInterface.execute` → scanner ADT judgment → `ManifestBuilderJudgment` → CLI gate.

CLI gates display the preserved projection judgment as JSON and stop publication. The core orchestrator also propagates the blocked judgment rather than projecting it as a successful flow.

## Scope and limitations

- Existing complete-manifest fixture tests now explicitly unwrap the complete ADT arm.
- The legacy `semantic/relations` imports in `controllerDeclarationParser.ts` remain and were not changed in this phase.
- Rejection of the earlier controller-invocation inventory closure still has its own CLI exception path; this phase closes the later source-AST projection blocker path only.
- Structural audit passed 12/12 checks.
- TypeScript syntax transpilation passed 15/15 changed files.
- Full typecheck, Vitest, and build were not run.
