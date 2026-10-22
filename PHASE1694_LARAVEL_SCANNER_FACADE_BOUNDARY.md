# Phase 1694 — Laravel Scanner Facade Boundary

## Trace observed in Phase 1693

`SourceProjectIdentity` → `laravelSourceAstScanner.scan()` → scan orchestration mixed with subscanner invocation and relation-based collection shaping → `SourceAsts` → complete-AST validation → `CompleteLaravelSourceModel` → semantic dataflow judgments / query policy contracts → `RouteSyncManifest`.

The Phase 1693 scanner interface was only a wrapper around a large orchestration function. The interface existed, but the facade file still imported subscanners, semantic relation operators, model-symbol-table construction, and the semantic producer directly. That was not a thin facade boundary.

## Phase 1694 change

- Added the type-only `LaravelSourceAstPipelineInterface` contract under `packages/core/src/types/upstream`.
- Moved the concrete evidence-to-AST orchestration into `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`.
- Reduced `packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts` to a facade that delegates to `laravelSourceAstPipeline.execute` and retains the compatibility `scanSourceAsts` entry point.
- Kept `upstreamManifestBuilder` as a consumer of `LaravelSourceAstScannerInterface`; manifest construction was not duplicated.
- Added a static boundary audit script.

## Boundary that is improved, and boundary that is not yet closed

Improved: the scanner facade no longer owns scan order, imports subscanners, or imports semantic relation operators. The orchestration has an explicit interface and a single wiring owner.

Not yet complete: `laravelSourceAstPipeline.ts` still coordinates a broad set of producers and performs collection-level relation operations (including deriving contextual attribute names from attribute evidence). The phase does **not** claim all Laravel semantic reasoning has already been extracted into closed upstream judgment authorities. The next semantic cutover should move each domain decision to its existing canonical authority and make the pipeline only pass typed evidence/judgments between those authorities.

## Intended flow

Laravel source evidence → canonical evidence producers → upstream semantic authorities / closed judgments → `LaravelSourceAstPipelineInterface` wiring → `LaravelSourceAstScannerInterface` facade → AST completeness validation → `CompleteLaravelSourceModel` → dataflow judgments / graph / IR / manifest consumers.

The type barrel contains contracts only for the new interface; no runtime implementation was added under `types/upstream`. No dependency on `core/src/semantic/foundation` was introduced.
