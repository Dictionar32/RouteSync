# RouteSync Phase 2448 — Laravel Route Composition Authority and Legacy Route-Subscanner Retirement

## Scope

This phase closes the route-scanner's direct dependency on the old route-specific subscanner modules and moves route composition, policy projection, source selection/observation, and final scan-outcome classification behind the existing `LaravelRouteScannerInterface` authority boundary.

It does **not** claim global removal of `semantic/relations` or `semantic/foundation`. A transitive import audit still finds dependencies through existing upstream contracts and the legacy closure-return semantic producer; those are explicit follow-up work, not hidden by moving files.

## Contract evolution

`LaravelRouteScannerInterface` contract version is now **34**. Its existing `LaravelRouteScanOperationInterface.execute()` remains parameterless. The scanner authority now carries `LaravelRouteDeclarationCompositionAuthorityInterface`, whose closed operations are:

- `compose(...)` — consumes route declaration evidence and injected authorities, then produces route boundaries;
- `catalogFromControllerScan(...)` — forms the policy inventory judgment from the complete/blocked controller scan;
- `policyForBinding(...)` — projects the already-judged controller binding and policy evidence;
- `resolveSourceFiles(...)` and `observeSourceFiles(...)` — resolves source selection and produces explicit scanned/absent or blocked judgments;
- `outcomeFromScan(...)` — aggregates response and policy blockers into the closed scan outcome.

The active runtime scanner now performs file I/O, parsing, and operation wiring. It no longer owns the local route-declaration emission helper, route/action correlation helper, response projection helper, effective-policy helper, source-selection helper, or final blocked-outcome classifier.

## Route-subscanner retirement

The active scanner no longer imports:

- `subscanners/routeProducerRelations.ts`
- `subscanners/route-scanner`
- `subscanners/scannerUtils.ts`

The first two route-specific legacy modules were deleted after redirecting the active path and updating the Phase 2219 source assertion to inspect `compiler/scanner/upstream/routeDeclarationComposition.ts`.

`routeBoundaryEmitter.ts` now resides at `compiler/scanner/upstream/routeBoundaryEmitter.ts`; its active implementation uses the closed `Presence` ADT and direct array projection instead of importing `semantic/relations` primitives.

## Direct relation-dependency cleanup

The active scanner, route declaration composition module, and route boundary emitter have no direct imports from `semantic/relations` or `semantic/foundation`.

Two other active dependency edges were also removed:

- `types/upstream/presence.ts` now implements the existing `Presence` ADT directly, without importing relation/foundation helpers.
- `utils/naming/lexer/tokenizer.ts` now executes its deterministic lexical state transitions without importing `semantic/relations/relationalSequence`.

## Validation evidence

- Phase 2448 structural audit: **8/8 checks passed**.
- TypeScript syntax/transpilation: **6/6 changed source files passed**.
- Focused TypeScript diagnostics: **0 diagnostics attributed to the changed route-scanner, composition, emitter, upstream contract, Presence, and tokenizer files**.
- Tokenizer smoke cases: **5/5 passed** (`LaravelRouteScanner`, `order_item`, `HTTPResponse`, `route42Group`, empty input).
- The focused `tsc` command still exits nonzero because the imported project graph contains **1,220 diagnostics in other files**. This phase does not claim a clean project typecheck, package build, Vitest run, or CLI E2E run.

## Remaining architecture blockers

The transitive source graph still reaches `semantic/relations` / `semantic/foundation`. The structural audit prints representative paths. Important remaining owners include:

1. `compiler/scanner/upstream/routeDeclarationComposition.ts` imports `subscanners/controller/controllerAstCanonical` to produce closure-return semantics. Replacing this edge requires a proper upstream closure-return semantic production contract; returning a fabricated `absent` judgment would lose information and is not an acceptable shortcut.
2. `types/upstream/laravelRouteScannerInterface.ts` reaches `types/upstream/resourceModelBindingSemanticInterface.ts`, which imports `SemanticRelationRewrite`, `SemanticRelationPattern`, and `SemanticRelationVariable` from `semantic/relations/semanticRewriteEngine.ts`. Those rule-model types need migration to their true upstream owner before the relations directory can be deleted.
3. Several upstream vocabulary modules still reach relation helpers through collection, expression, model, and middleware contracts. This requires a transitive owner-by-owner migration, not a broad search-and-replace or replacement relation utility.

The next repair must continue from these concrete dependency paths. Do not reintroduce `semantic/relations`, `semantic/foundation`, or a route-specific `subscanners` adapter as a destination for migrated contracts.
