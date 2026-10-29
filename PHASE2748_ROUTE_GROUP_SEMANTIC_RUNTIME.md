# Phase 2748 — Route-group semantic runtime: erase relations helper dependency

## Source defect fixed

The route-group AST adapter had already been converted to an interface-typed operation object in Phase 2747, but its production consumer, `packages/core/src/compiler/scanner/upstream/route/routeGroupSemanticResolver.ts`, still imported `relationGate`, `relationProject`, `relationEqual`, `relationVariantFold`, and `relationAdvanceIndex` from the intentionally empty `semantic/relations/` tree. That meant the route-group runtime path was still structurally coupled to a removed implementation layer.

## Actual runtime implementation changes

1. Removed all `semantic/relations/` imports from `routeGroupSemanticResolver.ts`.
2. Replaced relation helper projection of constraints with native typed `facts.constraints.map(...)` and immutable `Sequence<RouteConstraint>` construction.
3. Replaced relation-fold constraint handling with an exhaustive `switch (argument.kind)` over `none | values | pattern`, including a `never` exhaustiveness guard.
4. Replaced relation-gated prefix, middleware, and name-prefix resolution with direct typed branching and native array mapping.
5. Replaced relation-gated controller/domain presence handling with exhaustive `switch` statements over the `Presence` ADT.
6. Replaced lookup-table binding-scope resolution with an exhaustive switch over `scoped | without_scoped | default`.
7. Kept the public resolver as `export const routeGroupSemanticResolver: RouteGroupSemanticResolverInterface = Object.freeze({...})`; no exported free-function API was added.
8. Changed the judgment's resolution label from `relation_fact_projection` to `typed_fact_projection`, reflecting the actual implementation.
9. Updated three stale Phase 69 tests to import `routeGroupAstFactsOperations` and call `.extractFacts(...)` rather than the removed `extractRouteGroupFactsFromAst` function; corrected the group-constraint fixture to the `pattern` ADT variant and added assertions for the resolved pattern constraint.
10. Added `audit:phase2748-route-group-semantic-runtime` and its static audit script.

This is a source-level runtime path correction, not a directory move. It removes the route-group semantic resolver's direct dependency on the absent relation layer and makes the relevant ADT elimination explicit.

## Runtime trace

`CLI scan/sync → composition.manifestScanOperation.scan(input) → routeSyncCliManifestScanOperationFactory.create(...) → manifest composition/builder preparation → laravelSourceAstPipelineFactory/runtime scanner wiring → route declaration AST → routeGroupAstFactsOperations.extractFacts(...) → routeGroupSemanticResolver.resolveContext(...) → RouteGroupContext/semantic judgments → manifest_builder_complete | manifest_builder_blocked → manifest projection`.

The phase changes the AST-fact-to-semantic-context segment. It does not claim that every CLI/manifest source path has been migrated.

## Verification actually performed

- Phase 2748 route-group semantic runtime audit: **15/15 passed**.
- Phase 2747 route-group AST operation audit: **12/12 passed**.
- Phase 2746 channel factory operation audit: **9/9 passed**.
- Phase 2745 descriptor/subscanner structural audit: **16/16 passed**.
- TypeScript `transpileModule` syntax-only check: **1,926 TS/TSX files, 0 syntax diagnostics**.
- `node --check` for the new audit script: passed.
- `packages/core/package.json` JSON parse: passed.
- Remaining source files referencing `semantic/relations/` or `semantic/foundation/`: **310** by direct search (down from 311 in the previous report).
- `routeGroupSemanticResolver.ts` references to relation/foundation imports or relation helper calls: **0**.
- `extractRouteGroupFactsFromAst` source references: **0**.
- `semantic/relations/` and `semantic/foundation/` remain empty; `scanner/subscanners/` and `scanner/descriptors/` remain absent.

## Verification not completed

Full project typecheck, unit-test execution, package build, and CLI end-to-end were not run. Syntax transpilation and static audits do not establish type correctness or behavioral test success. The repository environment previously lacked the project-local compiler/dependency setup needed for a valid full typecheck; the global TypeScript 5.8.3 compiler is not the package-declared compiler.

## Remaining work

There are still **310** source files referencing the intentionally empty relations/foundation paths. They must be triaged by actual runtime reachability and migrated incrementally, without recreating those directories or introducing replacement wrappers. The scanner still has other exported free functions outside the scope of this phase. The CLI-to-manifest trace remains in place, but this phase does not claim global import closure.
