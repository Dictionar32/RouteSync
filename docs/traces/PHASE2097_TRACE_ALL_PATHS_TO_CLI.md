# Phase 2097 — Static Trace All Paths Through CLI

## Scope and method

This is a **read-only static trace** of the Phase 2096 source snapshot. No production source files were changed. The trace reads TypeScript import/export references and the active CLI scan composition; it does not claim dynamic execution coverage, type correctness, or successful build. Tests/build/typecheck were not run.

## High-level production path

```text
packages/cli/src/index.ts
  -> commands/scan.ts
  -> parsers/php/controllerInvocationManifestComposition.ts
     -> discover app/Http/Controllers/**/*.php (filesystem inventory)
     -> parsers/php/sourceInvocationPipeline.ts
        -> parsers/php/sourceFrontendAstAdapter.ts (php-parser AST extraction)
        -> core upstream invocation pipeline authorities
     -> laravelControllerInvocationSemanticJudgmentAuthority.judge(...)
     -> laravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)
     -> core manifestBuilder.build(validated receipt)
        -> compiler/scanner/orchestrator/sourceAstScanner.ts
           -> compiler/scanner/wiring/laravelSourceAstPipeline.ts
              -> migration scan + schema producer
              -> ModelScanner / FormRequestScanner / query & attribute producers
              -> laravelControllerScanner
              -> laravelResourceScanner
              -> response, service, middleware, DTO, provider, route, channel scanners
              -> validateCompleteSourceAst
        -> types/upstream/highLevelSourceModel.buildCompleteLaravelSourceModel(...)
        -> semanticDataflowInputsFromSourceModel
        -> semanticDataflowJudgmentsFromInputs
        -> resourceGroupCapabilitiesFromRoutes
     -> CLI maps RouteSyncManifest into RouteManifest projection
     -> ManifestContractValidator
     -> ManifestGenerator.save(routesync.manifest.json)
     -> graph projection -> routesync.graph.json
     -> dataflow analysis -> routesync.dataflow.json
     -> dataflow IR projection -> routesync.dataflow.ir.json
     -> IR registry -> routesync.ir.json
```

### Important distinction

The active `scan` command enters through the whole-file PHP invocation pipeline and the `manifestBuilder`; it does **not** simply call `StaticLaravelScanner` as its primary command path. `StaticLaravelScanner.ts` and `LaravelSourceLexer.ts` are exported/public scanner surfaces and are used by parts of the core scanner, but they are not interchangeable entrypoints.

## Legacy dependency inventory (direct static imports)

- Core files importing `compiler/scanner/subscanners/...`: **24**.
- Core files importing `semantic/relations/...`: **379**.
- Core files importing `semantic/foundation/...`: **0**.
- CLI source files using relation helpers exposed through `@routesync/core`: **8**.
- Total direct import/export reference lines mentioning one of the three legacy paths: **825**.

### Interpretation

1. `subscanner` is not retired. The active AST pipeline imports `FormRequestScanner`, `ModelScanner`, response/migration/service/middleware/DTO/provider/attribute/query/schema producers, and route/controller producer helpers from the subscanner tree.
2. `semantic/relations` is deeply coupled. It is imported directly by the AST pipeline, controller scanner, route scanner, resource scanner, scanner binders/resolvers/symbol tables, upstream contracts/authorities, and many other core compiler modules.
3. No direct `semantic/foundation/...` imports were found by this scan (**0 files**). The `foundation` directory still exists and contains overlapping-but-not-identical files; zero direct path imports does not prove every file is dead, because re-exports, generated aliases, dynamic loading, and textual/non-TS references are outside this simple import test.
4. The CLI itself has parser code that imports relation helpers from `@routesync/core`. Therefore deleting the core relation exports before migrating CLI parser adapters would break the public package boundary.
5. The scanner still has runtime semantic decisions that call subscanner producers and relation operations. New interfaces in `types/upstream` do not by themselves sever these dependency edges.

## Direct CLI relation-helper consumers

- `packages/cli/src/parsers/php/algebra/fieldNodeAlgebra.ts`
- `packages/cli/src/parsers/php/algebra/memberAlgebra.ts`
- `packages/cli/src/parsers/php/ast/calleeCatamorphism.ts`
- `packages/cli/src/parsers/php/astBoundarySemanticInterface.ts`
- `packages/cli/src/parsers/php/boundaryAdapter.ts`
- `packages/cli/src/parsers/php/expressionParser.ts`
- `packages/cli/src/parsers/php/nodeMapper.ts`
- `packages/cli/src/parsers/php/sourceSlice.ts`

These must be included in the migration plan; tracing only `packages/core/src/compiler/scanner` would miss them.

## Scanner choke points observed

- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`: central orchestration; direct imports from both `subscanners` and `semantic/relations`.
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`: calls `scanControllerAction` and uses controller AST canonicalization helpers from subscanners, plus relation folds/projections.
- `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`: reads route declarations and calls route producer/path-emitter helpers in subscanners, plus relation operations.
- `packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts`: resource resolution/production boundary; must be traced alongside resource binders/resolvers.
- `packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts`: thin facade that delegates to the AST pipeline; it does not remove downstream coupling.
- `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`: accepts the inventory closure receipt, invokes the source AST scanner, builds the complete source model and dataflow, and returns the semantic manifest.
- `packages/core/src/index.ts`: re-exports relation functions from `semantic/relations`, making those utilities part of the CLI-facing package boundary.

## Migration dependency order (trace result, not performed)

1. Keep this as the baseline graph; do not delete files yet.
2. Finish upstream interface/ADT contracts for each scanner responsibility, including source evidence, closed judgments, source correlation, and blocked/partial outcomes.
3. For each choke point, replace semantic decisions with injected/owned authorities that return complete judgments; keep scanner orchestration as wiring only.
4. Migrate all producers/consumers of a responsibility before removing its subscanner module.
5. Replace relation-helper usage in core and the eight CLI parser consumers with domain-specific ADT visitors/folds or a separately justified non-semantic collection utility. Do not merely rename/move the relation functions.
6. Remove public exports only after all core and CLI consumers are migrated; audit external API compatibility.
7. Re-run this trace and require zero production imports of retired paths; then run typecheck/tests in the supported project environment.

## Explicit limitations

- Static import trace only; not a runtime call graph.
- Does not resolve every barrel export/re-export into transitive symbol-level use.
- Does not prove that `semantic/foundation` is safe to delete.
- Does not modify implementation or claim removal is complete.
