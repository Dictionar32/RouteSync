# Phase 2749 — Fully typed controller middleware runtime operation

## Goal

Replace the relation-library dependency in the production controller-policy → route-middleware projection with native, typed ADT handling. This phase changes runtime behavior paths and callers; it is not a directory relocation.

## Source changes

- `packages/core/src/compiler/scanner/upstream/route/controllerMiddlewareProjection.ts`
  - Removed imports from `semantic/relations/relationalSequence` and `semantic/relations/semanticRelations`.
  - Replaced relation-based sequence traversal with an exhaustive `Sequence<T>` switch (`empty` / `cons`, with a `never` exhaustiveness guard).
  - Added an exhaustive guard to the controller middleware action-scope ADT switch.
  - Replaced relation select/expand/variant-fold helper composition with typed filtering and direct declaration/exclusion projection. Only `controller_middleware_relation` variants are retained; only named middleware becomes route middleware; declarations and exclusions remain separated.
  - Replaced the exported free function with `ControllerMiddlewareProjectionOperationsInterface` and frozen `controllerMiddlewareProjectionOperations: ControllerMiddlewareProjectionOperationsInterface`.
- `packages/core/src/compiler/scanner/wiring/route/controllerMiddlewareProjection.ts`
  - Updated the wiring export to the typed operation object.
- Updated both upstream and wiring Phase 901 tests to call `controllerMiddlewareProjectionOperations.project(...)` and construct test sequences directly, removing their imports from the empty relations directory.
- Added `scripts/audits/audit-phase2749-controller-middleware-runtime-operation.cjs` and package script `audit:phase2749-controller-middleware-runtime-operation`.

## Runtime trace

The affected production segment is controller policy relations → `controllerMiddlewareProjectionOperations.project(policy)` → route middleware declarations/exclusions → route middleware contracts consumed by upstream route/manifest composition.

The broader route-to-manifest trace remains: CLI scan/sync → `composition.manifestScanOperation.scan(input)` → `routeSyncCliManifestScanOperationFactory.create(...)` → upstream manifest composition → `laravelSourceAstPipelineFactory` → AST and semantic judgments → `manifest_builder_complete | manifest_builder_blocked` → manifest projection.

## Verification actually run

- Phase 2749 focused static audit: **15/15 passed**.
- Phase 2748 audit: **15/15 passed**.
- TypeScript 5.8.3 `transpileModule` syntax-only check across **1,926 TS/TSX files**: **0 syntax diagnostics**.
- `node --check` for the new audit script: passed.
- `packages/core/package.json` JSON parse: passed.
- ZIP integrity (`unzip -t`): to be checked on the generated artifact.

No full TypeScript typecheck, unit test runner, package build, or CLI end-to-end run is claimed; dependencies are not installed in this workspace.

## Structural constraints and unresolved work

- `packages/core/src/semantic/relations/` remains present and empty.
- `packages/core/src/semantic/foundation/` remains present and empty.
- `packages/core/src/compiler/scanner/subscanners/` remains absent.
- `packages/core/src/compiler/scanner/descriptors/` remains absent.
- A source scan still finds **307 TS/TSX files** with references to `semantic/relations/` or `semantic/foundation/`. These are unresolved and intentionally not concealed or replaced by new wrappers.

## Official TypeScript references

- Interfaces define structural contracts for values: https://www.typescriptlang.org/docs/handbook/interfaces
- Discriminated unions and exhaustive checking: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
