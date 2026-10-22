# Phase 2701 — Fully Typed Runtime Scanner Operations

## Scope

This iteration continues the Phase 2700 work in the actual runtime path. It does not make an `examples/`-only change.

### Runtime path traced

```text
CLI executable entry
  -> routeSyncStandaloneCliOperation.run()
  -> routeSyncStandaloneCompositionLoader.load(environment module)
  -> routeSyncStandaloneCompositionGuard.isComposition(host composition)
  -> routeSyncCliProgramFactory.createFromSemanticComposition(...)
  -> routeSyncCliUpstreamCompositionFactory.compose(...)
  -> routeSyncCliManifestScanOperationFactory.create(manifest authority)
  -> scan/sync command factory objects
  -> composition.manifestScanOperation.scan(input)
  -> controllerInvocationManifestCompositionAuthority.compose(input)
  -> canonical project identity
  -> controller-root discovery and source acquisition
  -> source-document identity binding
  -> whole-file semantic pipeline delivery
  -> upstream inventory authority and manifest builder preparation
  -> manifest judgment (accepted or explicit blocked/rejected ADT)
```

## Changes

The following exported function-valued constants were replaced with interface-typed operation objects on the runtime path:

- `loadRouteSyncStandaloneComposition(...)` -> `routeSyncStandaloneCompositionLoader.load(...)`
- `isRequestTypeDerivationSemanticPipelineComposition(...)` -> `routeSyncStandaloneCompositionGuard.isComposition(...)`
- `runRouteSyncStandaloneCli()` -> `routeSyncStandaloneCliOperation.run()`
- `analyzePhpSourceInvocationSemanticPipeline(...)` and its batch wrapper -> `phpSourceInvocationSemanticPipelineOperations.analyze(...)` / `.analyzeBatch(...)`

All relevant runtime call sites and the standalone-composition test imports/calls were updated. Existing composition, semantic ownership, rejection ADTs, and fail-closed behavior are retained; this refactor does not introduce a fallback or claim semantic proof where no verifier exists.

## Type shape

```typescript
export interface RouteSyncStandaloneCompositionLoaderInterface {
  readonly load: (
    modulePath: string | undefined,
  ) => Promise<RouteSyncStandaloneCompositionLoadResult>;
}

export const routeSyncStandaloneCompositionLoader:
  RouteSyncStandaloneCompositionLoaderInterface = Object.freeze({
    load: async (modulePath: string | undefined):
      Promise<RouteSyncStandaloneCompositionLoadResult> => {
      // existing fail-closed loader implementation
    },
  });
```

The method implementation remains executable code, but the *exported runtime symbol* is an interface-typed object, as requested. Interface typing alone does not replace TypeScript build/typecheck or runtime integration tests.

## Static audit

- PASS — legacy loader export absent
- PASS — legacy guard export absent
- PASS — legacy cli runner export absent
- PASS — legacy pipeline analyze exports absent
- PASS — new loader object present
- PASS — new guard object present
- PASS — new cli runner object present
- PASS — new pipeline ops object present

## Verification limits

- Source-level migration checks are run against the archive contents.
- Full TypeScript typecheck, package build, unit tests, and CLI end-to-end execution were **not run in this environment**. Do not interpret the static checks as proof of full build/runtime correctness.
- The upstream semantic reasoning/verifier completeness gap recorded in earlier audit phases remains separate and unresolved. This iteration does not conceal it.

## Upstream recommendation

1. Run the repository's package-manager typecheck and build for `packages/cli` and `packages/core`.
2. Run `packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts` plus CLI scan/sync integration tests.
3. Add a static audit that rejects direct exported function declarations and exported function-valued constants specifically within the canonical manifest runtime dependency graph.
4. Continue implementing missing semantic reasoning and independent proof verification at their existing upstream contract owners; preserve blocked outcomes until verified.

## Related reference

The TypeScript Handbook explains interfaces as structural contracts for object shapes and describes function-valued properties. The object-based export pattern used here follows that model:
- https://www.typescriptlang.org/docs/handbook/2/objects.html
- https://www.typescriptlang.org/docs/handbook/2/functions.html
