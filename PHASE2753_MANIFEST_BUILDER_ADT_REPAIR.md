# Phase 2753 — Manifest Builder ADT Repair (not operation relocation)

## Defect corrected

The previous manifest-builder contract exposed one outer `manifest_builder_blocked` tag and used `stage` to distinguish AST projection blockers from source-model blockers. Although that was technically a discriminated union, the actual failure domain was under-modelled: the blocker payload was placed directly on the outer result and did not itself have a closed discriminator. This phase adds a proper nested blocker ADT with separate `kind` values while retaining the outer terminal gate used by CLI callers.

## Corrected model

- `ManifestBuilderJudgment = ManifestBuilderCompleteJudgment | ManifestBuilderBlockedJudgment`
- `ManifestBuilderBlockedJudgment` is a union of `ManifestBuilderSourceAstBlockedJudgment` and `ManifestBuilderSourceModelBlockedJudgment`.
- The AST arm carries `blocker.kind = manifest_builder_source_ast_blocked` and the exact non-complete `LaravelSourceAstProjectionJudgment`.
- The source-model arm carries `blocker.kind = manifest_builder_source_model_blocked` and the exact `CompleteSourceModelBuildBlockedResult`.
- `stage` remains as a compatibility-level discriminator for existing CLI presentation and downstream diagnostics; the nested `blocker.kind` is the semantic ADT discriminator for exhaustive reason-specific handling.

## Runtime invariant

`laravelSourceAstPipeline.execute()` must first return `laravel_source_ast_projection_complete` before the source-model builder is invoked. The source-model builder must then return its complete arm before dataflow projection or `route_sync_manifest` construction. The scanner returns the entire blocked judgment unchanged. CLI `scan`, `sync`, and drift audit stop before publishing/using a manifest when the outer judgment is blocked.

No branch synthesizes an empty AST, empty manifest, or successful manifest from a partial/blocked judgment.

## Runtime trace

`CLI scan/sync/drift` → `buildManifestWithInvocationPipeline` → invocation inventory closure → `ManifestBuilderInput` → `ManifestBuilderInterface.build` → `LaravelSourceAstPipelineInterface.execute` → `LaravelSourceAstProjectionJudgment` → either `ManifestBuilderSourceAstBlockedJudgment` or complete AST → `CompleteLaravelSourceModelBuilderInterface.build` → either `ManifestBuilderSourceModelBlockedJudgment` or complete source model → dataflow/capability projection → `ManifestBuilderCompleteJudgment` → CLI publication gate.

## Verification

Run:

```bash
npm run audit:phase2753-manifest-builder-adt-repair
node packages/core/scripts/audits/audit-phase2314-manifest-builder-blocked-adt.cjs
```

These are source-structure audits. They do not establish full TypeScript semantic typecheck, complete unit-test coverage, package build, or CLI end-to-end success.
