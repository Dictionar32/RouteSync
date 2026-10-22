# Phase 2311 — Source-AST Runtime Executor ADT

## Problem

`LaravelSourceAstPipelineInterface.execute` accepted the invocation receipt and an optional `LaravelRouteSourceSelection` as separate arguments. The interface therefore represented route-selection intent through absence/presence rather than an explicit semantic state. The runtime executor's public contract was not a single closed input ADT.

## Contract-first change

The existing `LaravelSourceAstPipelineInterface` is evolved, not duplicated:

- `LaravelSourceAstRouteSelectionInput` distinguishes `laravel_source_ast_route_selection_default` from `laravel_source_ast_route_selection_explicit`.
- `LaravelSourceAstPipelineExecutionInput<Receipt>` binds the exact invocation inventory receipt to that route-selection state.
- `execute` accepts one complete input object and returns the existing closed `LaravelSourceAstProjectionJudgment<Receipt>`.
- The contract version advances from 10 to 11.

## Runtime alignment

`createLaravelSourceAstPipeline` and its executor now consume the new ADT. The executor only dispatches the supplied route-selection variant to the existing route scanner contract. It does not derive route-selection intent from a missing optional argument. The manifest composition boundary adapts its existing convenience parameter into the closed input ADT before calling the executor.

The result ADT remains unchanged: complete, incomplete, attribute-scan-blocked, and controller-scan-blocked are distinct outcomes. A blocked controller scan still stops later projection and manifest publication as established in Phase 2309.

## Trace

`CLI scan/sync` → `controllerInvocationManifestComposition` → `constructRouteSyncManifest` → closed `LaravelSourceAstPipelineExecutionInput` → `LaravelSourceAstPipelineInterface.execute` → controller/route scanner contracts → `LaravelSourceAstProjectionJudgment` → manifest publication gate.

## Scope and verification

This phase changes the executor boundary only. It does not claim that all optional arguments across RouteSync have been removed, that the PHP grammar inventory is complete, or that `semantic/relations` has been removed from the controller parser. No dependency on `semantic/foundation` or `semantic/relations` was added to the executor contract/runtime path.

Run the structural audit with:

`node scripts/audits/audit-phase2311-source-ast-executor-adt.cjs`

A full TypeScript check/build was not run as part of this phase.
