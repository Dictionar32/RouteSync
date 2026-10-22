# Phase 1975 — Interface-only invocation receipt correlation

## Scope

This phase changes only existing type/interface contracts plus its audit/documentation. It does not implement or edit scanner runtime, semantic authorities, executors, resolver logic, AST projection functions, or wiring. It creates no `relation` or `foundation` subscanner and does not add a parallel invocation judgment or inventory.

## Trace

Canonical path:

`LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt` → `LaravelSourceAstPipelineInterface.execute` → `LaravelSourceAstScannerInterface.scan` → `LaravelSourceAstProjectionJudgment` → canonical `SourceAsts` aggregate.

The canonical `SourceAsts` aggregate already owns `controllerInvocationSemanticInventory`; therefore a detached receipt sidecar would duplicate authority. The actual gap was that `LaravelSourceAstProjectionJudgment` and the two interface method signatures did not express that the exact receipt admitted at the boundary must remain the receipt carried inside the resulting AST aggregate. A broad receipt type allowed the correlation to be widened at the type boundary.

## Contract correction

- `LaravelSourceAstProjectionJudgment<Receipt>` now correlates both complete and blocked AST arms with `controllerInvocationSemanticInventory: Receipt`.
- `LaravelSourceAstPipelineInterface.execute` and `LaravelSourceAstScannerInterface.scan` are generic over the admitted receipt subtype and return the matching judgment specialization.
- The existing `CompleteSourceAst`, `IncompleteUpstream`, and `SourceAsts` remain canonical. No second completeness or invocation authority was introduced.
- This is a type-level guarantee of correlation, not a claim that current runtime implementations already satisfy the stricter contract.

## Subscanner retirement trace

The current snapshot still contains `packages/core/src/compiler/scanner/subscanners` and production imports from it. The trace found 65 references under `packages/core/src/compiler/scanner` that mention `subscanners`/`subscanners/`; several are production wiring, helpers, and binders, not merely leaf scanner classes. Deleting the directory in an interface-only phase would leave runtime imports broken. This phase therefore does not delete or edit those implementations. Retirement must be driven by the existing upstream contracts and a verified zero-production-consumer boundary, not by creating replacement `relation`/`foundation` layers.

## Validation

The structural audit checks receipt subtype preservation in both ADT arms and both interface methods, existing canonical proof types, public export, and that runtime source files remain untouched. It does not claim TypeScript compilation or build success.
