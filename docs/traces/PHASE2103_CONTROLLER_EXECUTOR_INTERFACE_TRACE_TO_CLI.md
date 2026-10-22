# Phase 2103 — Controller Executor Interface Trace Through CLI

## Scope

This phase starts from Phase 2102 and makes the controller scanner consume an explicit action-execution interface. It also removes direct relation-algebra imports from the controller scanner and controller producer, and changes the producer's action projection from a relation `Sequence` to an immutable array contract.

This is a bounded migration step. It does **not** claim that relation, foundation, or subscanner implementations have been retired from the full compiler/CLI dependency graph.

## Trace

```text
packages/cli/src/commands/scan.ts
  -> PHP controller invocation composition / source invocation pipeline
  -> authority-closed invocation inventory receipt
  -> ManifestBuilder
  -> LaravelSourceAstScanner
  -> LaravelSourceAstPipeline
  -> LaravelControllerScannerInterface.scan
  -> declaration authority source-bearing correspondence
  -> declaration inventory closure gate
  -> LaravelControllerActionExecutionInterface.execute
  -> ControllerProducer projection
  -> integrated response semantic judgment
  -> AST projection with the exact invocation + response judgment pair
  -> CompleteLaravelSourceModel
  -> semantic dataflow and manifest / IR projection
  -> CLI output
```

## Files changed

- `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts`
  - Adds `LaravelControllerActionExecutionInterface` and typed input/result contracts; the exact invocation judgment is the source-identity authority for action execution.
  - Isolates the current `scanControllerAction`, source reader, controller producer, and controller AST projection functions in an explicit production composition module.
  - The module name and comments explicitly disclose that the old action implementation is still bound here.
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
  - No direct imports from `semantic/relations`, `semantic/foundation`, or `subscanners`.
  - Uses native array operations for local collection orchestration.
  - Calls the injected action-execution interface after declaration closure.
  - Preserves the original invocation judgment into producer and integrated-response judgment, then forwards that exact judgment with its response judgment into AST projection.
- `packages/core/src/types/upstream/controllerProducerInterface.ts`
  - `ControllerProducerResult.actions` is now a readonly array, not a relation `Sequence`.
  - `methods` remains a `Sequence` because the canonical controller AST's semantic method representation still uses that ADT.
- `packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts`
  - Removes direct relation-algebra imports.
  - Projects action contracts to a readonly array; constructs the AST's required method sequence directly.
- `scripts/audits/audit-phase2103-controller-execution-interface-boundary.cjs`
  - Checks the executor seam, source-bearing declaration judgment, closed scan outcome, and response/AST correlation.
- Historical audits for Phases 2098–2102 were updated to test the current architecture rather than requiring the now-removed direct imports / fold implementation.

## Dependency status

Static import scan of `packages/core/src` after this phase:

| Import family | Files with direct imports | Import statements | Status |
|---|---:|---:|---|
| `semantic/relations` | 377 | 708 | Still widely used in core |
| `semantic/foundation` | 0 | 0 | No direct imports detected; not sufficient evidence to delete the directory |
| `subscanners` | 24 | 54 | Still used by core; controller scanner's legacy bindings are isolated in the composition module |

The controller scanner implementation no longer directly imports relation/foundation/subscanner modules. However, `laravelControllerExecutionDependencies.ts` intentionally still binds the current legacy implementation. Therefore the production graph is **not yet free of subscanners**. Also, `ControllerActionContractResolverContext` still exposes a relation-index type, and many other compiler consumers retain relation imports.

## Semantic boundaries preserved

- The declaration authority's source-bearing correspondence ADT remains the source of declaration selection.
- The declaration inventory blocker gate remains before action, response, and AST execution.
- The invocation judgment remains attached to the controller producer input.
- Integrated response judgment is still composed from the same invocation judgment and declaration evidence.
- AST projection receives the same invocation judgment and its corresponding response judgment.
- The complete/blocked controller scan remains a closed discriminated union.

## What remains incomplete

1. The action executor interface is currently a compiler-layer boundary, not yet a fully upstream-owned action semantic judgment. Its input still uses compiler lexer AST and descriptor context types. The legacy adapter forwards the judgment's source identity into the existing action scanner, but the old action resolver does not yet derive its semantics from the invocation judgment itself.
2. The composition module still calls `scanControllerAction` and `readSourceText`; this is dependency inversion, not semantic implementation retirement.
3. Controller AST canonical helpers still have legacy subscanner ownership behind the composition module.
4. `ControllerActionContractResolverContext` still uses relation-index representation.
5. The ancestry lattice/fixed-point witnesses (`heightBound`, `rounds`, `knownAncestors`) remain numeric and do not prove monotonicity or convergence by type alone.
6. Route/resource scanners, other subscanners, relation consumers, public exports, and CLI transitive paths still require migration before any broad deletion.

## Verification

- Phase 2098 audit: 10/10.
- Phase 2099 audit: 12/12.
- Phase 2100 audit: 12/12.
- Phase 2101 audit: 12/12.
- Phase 2102 audit: 12/12.
- Phase 2103 audit: 15/15.
- ZIP integrity checked after packaging.
- Build, TypeScript typecheck, and Vitest were not run.

Static audits validate only the explicitly checked source conditions. They do not establish type correctness or runtime behavior.
