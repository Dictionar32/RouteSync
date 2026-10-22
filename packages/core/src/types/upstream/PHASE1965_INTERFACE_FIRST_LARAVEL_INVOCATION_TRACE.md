# Phase 1965 — Interface-First Laravel Invocation / AST Trace

## Scope and constraints

This phase traces the current canonical path from the source-correlated invocation inventory through Laravel controller scanning, integrated response preservation, and `SourceAsts`. It does **not** add a `relation` or `foundation` subscanner, does not create a parallel invocation judgment, and does not claim a full runtime migration.

## Trace result

1. `types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts` already defines the canonical `LaravelControllerInvocationSemanticJudgmentInterface` as a discriminated union. Each member carries exactly one of `not_connected`, `source_binding_rejected`, `complete`, or `blocked` integrated response variants. The `sourceFile` and response are correlated in one judgment value.
2. `types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts` composes the existing source-binding and integrated-response authorities. Its `judge` operation creates the judgment from typed evidence; the scanner should not recreate this outcome.
3. `types/upstream/laravelControllerScannerInterface.ts` already requires the canonical invocation judgment inventory receipt and documents preservation of the judgment, source identity, integrated response, and ADT projections.
4. `compiler/scanner/wiring/laravelControllerScanner.ts` consumes `invocationInventoryReceipt.correspondences`, obtains each source identity from `invocationJudgment.sourceFile`, and calls `parseControllerDeclarationFromInvocationJudgment(..., invocationJudgment)`. It passes the same judgment to `controllerProducer.produce`. This is the correct provenance direction.
5. `types/upstream/laravelSourceAstPipelineInterface.ts` takes a closed inventory receipt and returns `Promise<SourceAsts>`. `compiler/scanner/wiring/laravelSourceAstPipeline.ts` preserves that exact receipt in `SourceAsts.controllerInvocationSemanticInventory`.

## Root problem still present

The Laravel source-AST runtime is **not yet a thin executor of one complete upstream semantic contract**. `compiler/scanner/wiring/laravelSourceAstPipeline.ts` still imports and directly invokes many concrete subscanner implementations (`ModelScanner`, `FormRequestScanner`, `scanResponseBundle`, `scanMigrationAsts`, `scanServiceBundle`, `scanMiddlewareAsts`, `scanDtoAsts`, `scanProviderBundle`, `scanAttributeAsts`, and `ChannelScanner`). It also imports `relation*` helpers for collection shaping. The controller scanner itself still performs inheritance traversal, method filtering, and controller action evidence construction in runtime.

That means the existing invocation judgment interface is materially stronger than the total Laravel scanner pipeline boundary. Fixing this requires elevating the *complete source-semantic projection contract* first—not adding another scanner folder, not moving functions into a different file, and not having the runtime infer missing meaning.

## Interface-first next model

The next interface should evolve `LaravelSourceAstPipelineInterface` rather than create a parallel pipeline. Its semantic input should be one source-bound closed judgment that already contains the canonical invocation inventory and the typed judgments for each source domain; its output should be an outcome-indexed projection judgment. Runtime should only execute that contract and preserve the exact input provenance.

The projection result should be a closed ADT, not a loose `SourceAsts` success-shaped object:

```ts
export type LaravelSourceAstProjectionJudgment =
  | Readonly<{
      readonly kind: 'source_ast_projection_complete';
      readonly sourceInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
      readonly sourceAsts: SourceAsts;
    }>
  | Readonly<{
      readonly kind: 'source_ast_projection_blocked';
      readonly sourceInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
      readonly blockingJudgments: readonly LaravelSourceAstBlockingJudgment[];
    }>;
```

`LaravelSourceAstBlockingJudgment` must be an existing domain-owned judgment type or be introduced in the existing upstream model after tracing the actual producers; it must not be invented as `string`, `unknown`, `Record`, or an uncorrelated error list. Before changing the interface signature, trace every `LaravelSourceAstPipelineInterface.execute` consumer and every `SourceAsts` consumer. Otherwise the change would just move the loose success boundary one level upstream.

## Explicit non-claims

- No full build or TypeScript compile was run.
- This trace does not claim that all 123 files below `scanner/subscanners` have been migrated or retired.
- It does not claim that relation helpers have been removed from runtime collection projection.
- `StaticLaravelScanner.ts` is already empty in this checkpoint; it was not restored or repopulated.
- No `semantic/relations` or `semantic/foundation` subscanner was added.
