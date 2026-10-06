# Phase 1038 — DataFlowInterface upstream → downstream boundary

## Decision

`DataFlowInterface` remains a small operational contract:

- `seed(input)`
- `derive(state)`
- `close(state)`
- `reaches(state, source, target)`

Domain semantics are not added to this interface. Laravel request/route/controller/model/resource/schema semantics are producers of semantic evidence, while policy and projections consume the canonical semantic interface.

## Downstream migration

`SemanticDataflowAnalysisResult` no longer exposes a duplicate `judgment` field. Downstream consumers use `analysis.interface`, and closed facts are obtained from `analysis.interface.judgment`.

`AstAnalysisInput` and `AstAnalysisJudgment` now carry `SemanticDataflowInterface`, not a raw `SemanticDataflowJudgment`. AST analysis reads its closure through `dataflow.judgment`, and `AstAnalysisInterface` preserves the exact interface identity rather than rebuilding it.

The raw `SemanticDataflowJudgment` type remains an authority-level type. It is used by the authority implementation and authority-focused tests, not as the production downstream transport contract.

## Domain boundaries

- Manifest: aggregates semantic seed/evidence into `SemanticDataflowInput`; it does not close or query flow.
- Route: projects route parameter binding evidence.
- Request: projects Laravel request access/validation evidence.
- Controller: projects controller/model/query/resource evidence.
- Model relation: structural relation evidence; it is not automatic value flow.
- Resource: response transformation evidence; it is not the dataflow solver.
- Schema: database/FK structural evidence; it is not automatic value flow.
- Graph: structural `GraphEdgeRelation` projection; it does not run dataflow closure.
- IR: consumes the canonical closed judgment through `SemanticDataflowInterface`; it does not run a second solver.

## Laravel upstream finding

Laravel documents dynamic request properties as payload-first and route-parameter fallback. Therefore `$request->id` may have request or matched-route provenance. This belongs in the Laravel request projection, not in `DataFlowInterface`.

Laravel also distinguishes validated data (`validated()` / `safe()`) from ordinary request input. This belongs in semantic flow-state/policy, not in the generic execution interface.

## External references

- CodeQL data flow configuration: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- CodeQL flow state: https://codeql.github.com/docs/codeql-language-guides/using-flow-labels-for-precise-data-flow-analysis/
- MLIR DataFlowSolver: https://mlir.llvm.org/doxygen/classmlir_1_1DataFlowSolver.html
- Laravel Requests: https://laravel.com/docs/requests
- Laravel Validation: https://laravel.com/docs/validation
- Soufflé relations: https://souffle-lang.github.io/relations

## Verification

The Phase 1038 audit checks the generic interface, semantic interface, pipeline result, AST boundary, policy consumers, IR consumer, manifest, route/request/controller projections, model relation/resource/schema separation, ecommerce fixture, and deprecated legacy adapter surface.
