# Phase 966 — Controller/model/resource/response dataflow enters canonical upstream interface

## Change

The canonical upstream semantic dataflow input now receives two additional proven controller-flow seed relations:

`controller model parameter -> resource model -> response resource`

The projection is implemented by `semanticDataflowControllerProjection.ts` and consumed by the production `analyzeRouteSyncManifestDataflow()` boundary.

## Authority

The projection only emits `SemanticDataflowFact` seeds. It does not solve, close, derive, or own reachability. The only semantic dataflow solver remains:

`SemanticDataflowInput -> createSemanticDataflowJudgment() -> SemanticDataflowInterface`

in `types/upstream/semanticDataflowAuthority.ts`.

## Laravel evidence boundary

The ecommerce fixture contains controller model parameters, Eloquent query operations, and API Resource returns. The projection only lowers facts already represented by the upstream `ControllerActionFlowContract.semantic.resources` and `ControllerParameter` contracts.

Scalar request and route parameters are not guessed as model bindings. Route parameter binding remains the separate `semanticDataflowRouteProjection` seed boundary, while expression-level request/query flow remains supplied by scanner semantic dataflow evidence.

## Deliberate exclusions

- No Laravel-specific `SemanticDataflowFact.kind` was introduced.
- No new dataflow solver was introduced.
- No CFG/SSA/dominator/loop machinery was moved into the semantic interface.
- No middleware/authorization policy relation was reclassified as value flow.
- No implicit Eloquent model binding is inferred from scalar controller parameters.

## External design basis

CodeQL models semantic runtime value propagation as a data-flow graph distinct from AST structure and uses source/sink/path relations for flow reasoning.

MLIR interfaces similarly provide generic semantic contracts so analyses do not encode knowledge of every concrete operation implementation.
