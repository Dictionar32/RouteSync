# Phase 1974 — Interface-only source AST projection judgment

## Scope

This phase changes contracts only. It does not change scanner implementations, authorities, runtime executors, AST projection functions, resolver logic, or wiring. It adds no `relation` or `foundation` subscanner and introduces no parallel invocation judgment/inventory.

## Trace and root cause

Canonical flow traced:

`LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt` → `LaravelSourceAstPipelineInterface.execute` → `LaravelSourceAstScannerInterface.scan` → `SourceAsts` consumers.

`SourceAsts` contains multiple `SourceDiscovery<T>` fields, each of which can legally be `not_scanned`. The existing `validateCompleteSourceAst` model already distinguishes `CompleteSourceAst` from `IncompleteUpstream`, but the pipeline and scanner interfaces erased that distinction by returning `Promise<SourceAsts>` unconditionally. A structurally valid aggregate could therefore cross the public source-AST boundary without carrying a closed completeness outcome.

## Interface correction

The existing `LaravelSourceAstPipelineInterface` now returns `Promise<LaravelSourceAstProjectionJudgment>`:

- `laravel_source_ast_projection_complete` carries the existing `CompleteSourceAst` proof-bearing type.
- `laravel_source_ast_projection_blocked` carries the partial `SourceAsts` and existing typed `IncompleteUpstream` completeness judgment.

The existing `LaravelSourceAstScannerInterface` mirrors the same response ADT instead of erasing blocked status. This reuses the canonical completeness types rather than inventing a new error list or a second completeness authority. The source-correlated invocation response remains nested in the existing `SourceAsts` aggregate; it is not copied into a sidecar.

## Explicit migration boundary

The current runtime implementation still returns `SourceAsts`. It has intentionally **not** been changed in this interface-only phase and is therefore not claimed to conform to the evolved interface yet. Runtime executor adaptation, pipeline wiring, and consumer migration are subsequent work and must not be smuggled into an interface phase.

## Validation

The structural audit checks the outcome ADT, proof-bearing complete arm, typed blocked arm, both interface signatures, public type export, and that no relation/foundation subscanner or runtime implementation was changed. It does not claim TypeScript compilation or build success.
