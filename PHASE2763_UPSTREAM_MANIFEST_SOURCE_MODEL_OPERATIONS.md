# Phase 2763 — Upstream manifest source-model runtime operations

## Runtime trace audited

`controllerInvocationManifestComposition` (CLI discovery/wiring) → `routeSyncCliManifestScanOperationFactory` → `routeSyncManifestScanner` → `manifestBuilderOperationPreparation` → AST pipeline → `completeLaravelSourceModelBuilder` → source-model catalog → semantic contract catalog → manifest ADT → validation/serialization/persistence downstream.

## Changes

- Replaced exported function declaration `modelSemanticNodeFromAst(ast: ModelAst): ModelSemanticNode` with `export const modelSemanticNodeFromAst: ModelSemanticNodeFromAstOperation = Object.freeze(...)`.
- Replaced exported function declaration `semanticContractCatalogFromSourceCatalog(catalog: SourceModelCatalog): LaravelSemanticContractCatalog` with `export const semanticContractCatalogFromSourceCatalog: SemanticContractCatalogFromSourceCatalogOperation = Object.freeze(...)`.
- Added named call-signature interfaces with explicit parameter and output types. Existing call sites and function-call compatibility are preserved, including the source-model builder and existing type-contract tests.
- Kept source-model values as typed domain data and preserved existing manifest blocker discriminators; no primitive fallback or CLI-side semantic reclassification was introduced.

## Why callable interfaces here

These two exports are already used as functions and are asserted as callable by existing type tests. A literal `{}` is not assignable to a callable interface. `Object.freeze((input): Output => ...)` provides the requested `export const name: Interface` boundary while preserving the existing runtime API. For object-style operations, use an interface with named methods and migrate all consumers together; do not silently break these existing callable contracts.

## Audit

Run `npm run audit:phase2763-upstream-manifest-source-model-operations`. The audit parses the five runtime files on the selected upstream manifest path, verifies no exported function declarations remain in that path, and checks the two new frozen interface-typed operations. It is a structural AST audit, not a substitute for a full semantic typecheck, unit suite, build, or CLI end-to-end execution.

## External references reviewed

- TypeScript Handbook — function call signatures: https://www.typescriptlang.org/docs/handbook/2/functions.html
- TypeScript Handbook — discriminated unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MDN — `Object.freeze()` runtime semantics: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
