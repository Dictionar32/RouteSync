# Phase2942 — Fully Explicit Route-Scan ADT Continuation

## Scope

Continue Phase2941 by fixing the documented route-scan consumer dispatch gap at its upstream contract boundary. Reuse the existing `LaravelRouteScanOutcome`, `LaravelRouteScannerInterface`, `LaravelSourceAstProjectionJudgment`, and route-source-selection contracts; no generic result wrapper or collection utility was introduced.

## Runtime trace

```text
CLI scan / sync
  -> upstreamCompositionFactory
  -> routeSyncCliManifestScanOperationFactory
  -> controllerInvocationManifestCompositionAuthority
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelRouteScannerInterface.prepare(input)
  -> prepared route scan execute()
  -> PhpSourceDocumentReaderInterface.read(input)
  -> PhpSourceDocumentReadBatchJudgment.continueWith(...)
  -> LaravelRouteScanOutcome.continueToSourceAstProjection(...)
  -> LaravelSourceAstProjectionJudgment.continueToManifestBuild(...)
  -> ManifestBuilderJudgment
  -> CLI drift audit / manifest publication gate
```

## Root-cause change

- Added `LaravelRouteScanProjectionContinuationInterface` to the existing upstream route-scanner contract. It explicitly describes the five domain terminals: complete scan, explicit source-selection blocker, source-read blocker, response blocker, and policy blocker.
- Evolved `LaravelRouteScanOutcome` so it owns `continueToSourceAstProjection(...)`.
- Each route-scan terminal is decorated with its matching operation at the producing boundary: source-selection blocker and read blocker in the route scanner; complete, response-blocked, and policy-blocked variants in route-declaration composition. No central `switch` is used to rediscover the variant.
- `laravelSourceAstPipeline.ts` no longer branches on `routeScan.kind`; it supplies domain-specific continuation operations. The complete branch contains the existing subsequent AST acquisition logic, while every blocked branch preserves its exact blocker judgment.
- Incremented `LaravelRouteScannerInterface` contract version 38 -> 39, prepared operation version 3 -> 4, and `LaravelSourceAstPipelineInterface` version 19 -> 20.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime contract example

```ts
return routeScan.continueToSourceAstProjection({
  onComplete: async scan => continueAstAcquisition(scan),
  onSourceSelectionBlocked: async scan => preserveSourceSelectionBlocker(scan),
  onSourceReadBlocked: async scan => preserveSourceReadBlocker(scan),
  onResponseBlocked: async scan => preserveResponseBlocker(scan),
  onPolicyBlocked: async scan => preservePolicyBlocker(scan),
});
```

The example is illustrative; the real implementation passes the existing typed AST projection constructors and evidence values. The pipeline no longer inspects the route-scan discriminant itself.

## Verification performed

- Phase2940 structural audit: 11/11 passed after updating the assertion to the new continuation ownership.
- Phase2942 route/CLI ADT audit: 9/9 passed.
- TypeScript syntax transpilation: 7/7 changed TypeScript files passed.
- JSON parse validation: `package.json` and phase audit JSON passed.
- Full typecheck, unit tests, package build, and CLI end-to-end were not verified because this extracted workspace has no `node_modules`, the configured `node` and `vitest/globals` type definitions are unavailable, and the globally installed TypeScript compiler rejects the repository’s `ES2025` target/lib settings; syntax transpilation is not a substitute for typechecking.
- Text search still finds 478 `export function` declarations in `packages/core/src` and `packages/cli/src`. Repository-wide conversion is not complete; this phase changes only the traced route-scan path and retains interface-first operation wiring there.

## Official reference

TypeScript's official Handbook documents interfaces as structural contracts and shows call signatures for function types: https://www.typescriptlang.org/docs/handbook/interfaces.html
