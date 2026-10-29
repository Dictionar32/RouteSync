# Phase 2765 — Source-Model Builder Object Operations

## Scope

Continues the upstream CLI manifest trace by making the two source-model construction boundaries object operations with explicit interfaces, `Object.freeze`, ADT identity tags, and typed `build` methods.

## Runtime changes

- `sourceModelReferenceIndexFromCatalog` is now a `SourceModelReferenceIndexBuilderInterface` object. Its `build` method explicitly accepts `SourceModelCatalog` and `readonly EffectiveControllerActionPolicy[]` and returns `SourceModelReferenceIndex`.
- `sourceModelReferenceIndexBuilder` remains a public compatibility name and aliases the same frozen operation object.
- `buildCompleteLaravelSourceModel` is now a `CompleteLaravelSourceModelBuilderInterface` object. Its `build` method accepts `CompleteLaravelSourceModelBuildInput` and returns the explicit `CompleteSourceModelBuildResult` ADT.
- `completeLaravelSourceModelBuilder` remains a public compatibility name and aliases the same frozen operation object.
- The upstream manifest builder continues to inject `completeLaravelSourceModelBuilder` and invoke `sourceModelBuilder.build(...)`.
- AST-pipeline failure and source-model policy failure retain distinct blocker discriminators; no primitive fallback is introduced.

## Runtime trace

CLI invocation-manifest composition → manifest scan operation → upstream manifest scanner → manifest-builder preparation → source AST pipeline → typed complete-source-model builder object → semantic contract projection and source-model reference-index object → complete/blocker ADT → manifest publication path.

## Validation

Run `npm run audit:phase2765-source-model-builder-object-operations`. The audit checks TypeScript AST parse diagnostics, object/interface shape, explicit method parameter/output types, frozen operation objects, alias identity, manifest-builder wiring, blocker ADT discriminators, and exported function declarations in the selected path.

Full semantic typecheck, unit tests, package build, and CLI end-to-end execution are not claimed unless separately run in an environment with project dependencies installed.
