# RouteSync Phase 3008 — Fully Explicit Operational Invocation Input ADT

## Objective

Move the top-level invocation input decision into the input ADT itself. Phase 3007 had already made the integration response operational, but `LaravelControllerInvocationSemanticJudgmentAuthority.judge` still switched on `input.kind`. This phase closes that specific gap without mechanically deleting unrelated control flow elsewhere in the repository.

## Runtime trace

```text
CLI scanner / middleware scanner
  -> laravelControllerInvocationSemanticInputFactory.withoutPipeline(sourceFile)
     or .withPipeline(sourceFile, pipelineResult)
  -> operational LaravelControllerInvocationSemanticInput
  -> input.continueWith({ onPipelineNotProvided, onPipelineProvided })
  -> absent pipeline: create explicit not-connected pipeline evidence
     provided pipeline: source identity binding
  -> source-binding ADT continuation
  -> pipeline integration authority
  -> operational integration result ADT
  -> response.continueWith(...)
  -> LaravelControllerInvocationSemanticJudgment
  -> inventory closure / manifest construction path
```

## Implementation

- Added `LaravelControllerInvocationSemanticInputHandlers<Result>` with the domain handlers `onPipelineNotProvided` and `onPipelineProvided`.
- Both input variants now carry `continueWith`, making the input ADT operational instead of a tagged payload only.
- Added `LaravelControllerInvocationSemanticInputFactoryInterface` and the explicitly typed runtime value `laravelControllerInvocationSemanticInputFactory: LaravelControllerInvocationSemanticInputFactoryInterface = Object.freeze({...})`.
- Added canonical constructors `withoutPipeline(sourceFile)` and `withPipeline(sourceFile, pipelineResult)`. Each constructed value owns a continuation that forwards the exact value to the corresponding handler.
- Replaced `switch (input.kind)` in `LaravelControllerInvocationSemanticJudgmentAuthority.judge` with `input.continueWith(...)`.
- Migrated scanner and test construction sites to the canonical factory. The preparation authority no longer hand-builds the provided-pipeline input.
- Exported the factory through the upstream barrel.
- Bumped the judgment contract version from 16 to 17 and aligned the runtime metadata with the interface contract.

## Usage

```ts
const input = laravelControllerInvocationSemanticInputFactory.withPipeline(
  sourceFile,
  pipelineResult,
);

const judgment = laravelControllerInvocationSemanticJudgmentAuthority.judge(input);
```

The input ADT's continuation selects the domain handler. The authority no longer reclassifies the input by inspecting its tag. The factory is a canonical constructor, not a second semantic authority.

## Audit and verification

- Structural audit: 13/13 checks passed.
- TypeScript syntax transpilation: 12 changed TypeScript files, 0 syntax diagnostics.
- Targeted TypeScript compiler invocation: command exits non-zero because the workspace still has unrelated baseline diagnostics. No diagnostics were emitted for the changed invocation input interface, authority, or preparation authority modules. This is not a full project typecheck pass.
- Tests were not executed: `node_modules` is not installed in the workspace and Vitest types/runtime are unavailable.
- `packages/core/src/types/upstream/collections.ts` remains whitespace-only.
- Removed relation foundation files remain absent: `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` were not restored.

## Known blockers / next trace

- The full workspace still contains unresolved imports into the deliberately removed relation foundation, missing `node:path` / Vitest type definitions, and pre-existing test/model typing issues.
- The route manifest to CLI invocation manifest field-by-field provenance bridge remains unproven. This phase only closes the invocation input dispatch boundary.
- Other `switch`, `if`, `===`, nullish fallback, and traversal arithmetic must be assessed by reachable runtime trace and ownership. They should not be removed mechanically.

## PHP / Laravel grounding

Laravel's routing documentation distinguishes closure routes and controller-action routes, documents parameter ordering relative to dependency injection, and describes implicit route-model binding. PHP type declarations specify the types accepted by parameters and returned values. RouteSync should retain these facts as typed upstream evidence, then pass operational ADTs to downstream consumers instead of re-inferring semantics from primitive tags.

References:
- https://laravel.com/framework/docs/routing
- https://www.php.net/manual/en/language.types.declarations.php
