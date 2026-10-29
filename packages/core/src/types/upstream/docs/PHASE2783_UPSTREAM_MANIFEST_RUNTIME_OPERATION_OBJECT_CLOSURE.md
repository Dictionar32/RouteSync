# Phase 2783 — Upstream Manifest Runtime Operation Object Closure

## Implemented runtime change

The active source-AST pipeline and manifest builder now use typed arrow-valued operation properties rather than object-method syntax:

- `laravelSourceAstPipelineFactory.create(...)` creates a `LaravelSourceAstPipelineInterface` operation whose `execute` closure captures the exact `dependencies` and `input` values. It no longer reads `this.dependencies` or `this.input`.
- `manifestBuilderOperationPreparation.prepare(input)` creates a `ManifestBuilderInterface` whose `build` closure captures `input` and `sourceAstPipeline`. Calling either operation detached from its containing object cannot lose the receiver.
- The exported authorities remain `export const name: Interface = Object.freeze({...})`; no exported function declaration was introduced.

This is an operation-binding correction, not a reimplementation of the scanners or manifest semantics.

## Runtime trace: CLI to upstream manifest

```text
packages/cli/src/commands/scan.ts (scan/sync entry)
  -> controllerInvocationManifestComposition
  -> manifestBuilderOperationPreparation.prepare(ManifestBuilderInput)
  -> laravelSourceAstPipelineFactory.create(dependencies, pipelineInput)
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceAstProjectionJudgment
       ├─ complete: CompleteSourceAst
       └─ blocked: preserve exact scanner/completeness blocker
  -> completeLaravelSourceModelBuilder.build(...)
       ├─ complete source model
       └─ manifest_builder_blocked(stage: source_model)
  -> SemanticDataflowManifestSurface operations
  -> manifest_builder_complete(RouteSyncManifest)
  -> downstream manifest projection/lowering and CLI SDK generation
```

The manifest builder checks `projection.kind` before reading `projection.completion`, and checks the source-model result before constructing the manifest. These checks preserve distinct ADT outcomes rather than representing blocked or unscanned evidence as an empty result. The active scanner contract is `LaravelSourceAstProjectionJudgment`; `SourceScanJudgment` is not yet wired end-to-end and must not be reported as if it were.

## ADT and reasoning boundary

- Existing `LaravelSourceAstProjectionJudgment` retains the scanner-specific complete and blocked variants.
- Existing `ManifestBuilderJudgment` retains complete vs blocked, including distinct source-AST and source-model blocker stages.
- This phase adds no reasoning primitive and does not remove the domain's existing reasoning contract.
- `packages/core/src/types/upstream/collections.ts` remains 0 bytes as required. No `Sequence`, `readonly T[]` substitute, or generic collection wrapper is added here.

## Focused structural audit

Run `npm run audit:phase2783-upstream-manifest-runtime-operation`. It checks the interface-typed operation objects, lexical capture (no `this` receiver dependency), the ADT gates, and the CLI composition link. It is a source-structure audit only; it does not prove typecheck, build, unit-test, or CLI end-to-end success.

## Recommendations / remaining root gaps

1. Keep migrating runtime entry points by actual producer-consumer path, and bind runtime operations through `export const name: ExistingInterface = Object.freeze({...})` where that interface describes a meaningful operation.
2. Integrate a source-scan ADT only if it becomes the actual contract passed from scanner acquisition through manifest construction. Do not layer a second ADT over `LaravelSourceAstProjectionJudgment` merely to satisfy naming.
3. Resolve imports from the intentionally empty `collections.ts` at their domain owners, together with producers, consumers, and tests; do not restore the emptied module as a compatibility facade.
4. After those root contracts are resolved, run TypeScript typecheck, focused tests, full tests, build, and a real CLI scan/sync fixture. Those checks remain outstanding.

## Official TypeScript reference

The TypeScript Handbook documents discriminated unions and control-flow narrowing as a way to keep variants explicit and safely narrow by literal discriminants: <https://www.typescriptlang.org/docs/handbook/2/narrowing.html>.
