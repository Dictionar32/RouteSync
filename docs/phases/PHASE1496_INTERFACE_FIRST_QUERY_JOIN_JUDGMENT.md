# Phase 1496 — Interface-first query join judgment

## Objective

Move query-join *meaning selection* out of `compiler/scanner` and into the upstream semantic algebra/interface. The scanner is allowed to extract syntax evidence and wire a resolved judgment into the query AST; it must not select the canonical `QueryOperation` variant for Laravel join spellings.

## Trace

- `types/upstream/queryProducerSemanticInterface.ts` is the contract surface for query semantics.
- `types/upstream/queryProducerSemanticAlgebra.ts` owns `joinCatalog`, validates join evidence via `resolveQueryJoin`, and now resolves source join names into a closed `QueryOperationAst` judgment via `resolveQueryJoinOperation`.
- `compiler/scanner/subscanners/queryEvidenceProducer.ts` extracts positional arguments and asks the upstream interface to resolve join operations before consulting the remaining legacy method catalog.
- `types/upstream/query.ts` remains the AST projection boundary; this phase does not yet preserve a `QueryProducerSemanticJudgment<QueryOperationAst>` on every operation node.

## Changes

1. Added `resolveQueryJoinOperation(methodName, arguments_)` to `QueryProducerSemanticInterface`.
2. Implemented the method in `queryProducerSemanticAlgebra` as a closed mapping from Laravel join vocabulary to canonical query-operation variants. It delegates structural join validation to the existing upstream `resolveQueryJoin` judgment and propagates `malformed` rather than treating malformed evidence as an unrecognized method inside the algebra.
3. Removed the scanner-local join mapping rules from `queryNamedMethodOperationCatalog`.
4. Changed scanner wiring to consume `resolveQueryJoinOperation` before the legacy catalog. The scanner no longer chooses `join`, `left_join`, `right_join`, `cross_join`, `join_sub`, `join_lateral`, or `straight_join` variants for these method names.

## Invariants improved

- Join operation spelling-to-meaning mapping has one semantic authority.
- Unknown method and malformed join evidence are distinct inside the upstream judgment (`not_applicable` vs `malformed`).
- Scanner code delegates semantic operation selection for the join family.

## Remaining boundary gaps (explicit, not claimed solved)

- `queryNamedMethodOperationCatalog` still contains semantic mapping for non-join methods (where, relation, aggregate and other operations); this phase does not claim the entire catalog has moved upstream.
- The scanner currently projects a malformed join judgment to the legacy `RelationOption` boundary, so its diagnostic is not preserved into `QueryAst`. The next model-level step should make operation judgments first-class in the AST (`resolved` / `malformed` / `not_applicable`) and make AST construction require a resolved judgment or carry the diagnostic.
- `QueryOperationAst` is still a projection type, not a proof-carrying semantic node. Full interface-first completion requires separating semantic judgment from compatibility AST projection and migrating downstream consumers to the judgment/contract.

## Verification

- TypeScript 5.8.3 targeted check of `queryProducerSemanticInterface.ts` and `queryProducerSemanticAlgebra.ts`: no diagnostics.
- Full scanner compile was attempted, but the repository reports numerous existing scanner/type errors under the available TypeScript 5.8.3 and dependency/configuration environment (including the scanner's existing `ExpressionArguments` reference and relational sequence narrowing). This is not reported as a successful full build.
- Root build/test were not run because the workspace has no local `node_modules/.bin/tsdown` / test runner installed.
