# Phase 836 — Production Semantic Pass Isolation

## Objective

Trace the CLI `generate` command and remove the unused legacy semantic-normalization pipeline from its production path without deleting the existing normalizer/pass files or changing their test coverage.

## Cutover

`packages/cli/src/commands/generate.ts` no longer constructs `SemanticResolutionKernel`, calls `normalizeManifest()`, or executes the legacy `ModelGraphBuilderPass` / `SemanticResolutionPass` / `NormalizationPass` chain.

The command already emitted the canonical `RouteManifest` through `CompilerBridge.emitFullBundle()`. The previous normalized result was not consumed by any subsequent operation, so keeping that pipeline in the production command only duplicated semantic work.

The command error boundary was also tightened from `catch (err: any)` to `catch (err: unknown)` with explicit `Error` narrowing.

## Preserved legacy surface

The following normalizer surface remains present because SDK tests still directly exercise it:

- `packages/cli/src/generators/normalizer.ts`
- `packages/cli/src/generators/passes/modelGraphBuilderPass.ts`
- `packages/cli/src/generators/passes/semanticResolutionPass.ts`
- `packages/cli/src/generators/passes/normalizationPass.ts`
- `packages/cli/src/generators/passes/validationPass.ts`

No files were deleted or emptied in this phase because their test reachability is non-zero.

## Audit

The Phase 836 audit verifies that the production `generate` command contains no invocation/import of the legacy semantic normalization pipeline and continues to use `CompilerBridge.emitFullBundle()`.

The audit intentionally does not classify the normalizer itself as dead: SDK tests remain explicit consumers and must be classified against the canonical semantic/IR authorities before any later isolation.

## Next frontier

Trace `ServiceGraphBuilder.buildFromRouteSyncManifest()` and `manifestGraphCompiler.ts` together with the producer of `RouteManifest`. The current boundary still takes both `RouteSyncManifest` and `RouteManifest`, and the CLI call still contains a legacy `as unknown as RouteManifest` cast. Do not introduce a new adapter until the existing producer/consumer authority is fully traced.
