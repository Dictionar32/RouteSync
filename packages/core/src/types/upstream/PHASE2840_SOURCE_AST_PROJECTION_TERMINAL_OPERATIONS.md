# Phase 2840 — Source-AST Projection Terminal Operations

## Root cause

`LaravelSourceAstProjectionJudgment` represented nine terminal outcomes as data-only union arms. The manifest builder had to inspect `projection.kind` to decide whether to continue with source-model construction or preserve a blocked result. That pushed interpretation of an upstream terminal into a downstream consumer.

## Runtime change

- Reused `LaravelSourceAstProjectionJudgmentData` as the closed union of the existing complete and blocked outcomes.
- Added `continueWith` to the public `LaravelSourceAstProjectionJudgment` contract, with typed `onComplete` and `onBlocked` handlers. The blocked handler receives the original, precise blocked arm union.
- Added `laravelSourceAstProjectionOperations`, an interface-first frozen object that binds each terminal operation where the projection producer constructs the result.
- Routed all eight blocked construction sites and the final complete/blocked completeness result through those operations.
- Changed `upstreamManifestBuilder` to call `projection.continueWith(...)` instead of checking `projection.kind` downstream.
- Exported the operation and its contract types through the core barrel. No new generic reasoning primitive or duplicate ADT was introduced; `collections.ts` remains empty.

## Runtime trace

`LaravelSourceAstPipelineInterface.execute()` → `laravelSourceAstProjectionOperations.complete/blocked(...)` → `LaravelSourceAstProjectionJudgment.continueWith(...)` → `ManifestBuilderInterface.build()` → complete manifest construction or exact `manifest_builder_source_ast_blocked` terminal.

## Example

```ts
const next = projection.continueWith({
  onBlocked: blocked => blocked,
  onComplete: complete => buildSourceModel(complete.completion),
});
```

The consumer supplies follow-up behavior; the ADT retains ownership of terminal interpretation. Blocked outcomes are not converted into an empty or success-shaped manifest.

## Verification boundary

Run `npm run audit:phase2840-source-ast-projection-terminal-operations`. This structural audit does not replace a full TypeScript typecheck, build, or E2E test.
