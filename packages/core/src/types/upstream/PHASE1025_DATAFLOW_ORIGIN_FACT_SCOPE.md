# Phase 1025 — Dataflow Origin/Facts Scope

Phase 1025 closes the remaining ambiguity between input origin and fact provenance.

## Boundary

`SemanticDataflowOrigin` identifies only the canonical semantic-dataflow input boundary and its semantic node. It no longer carries a producer lineage.

Producer provenance belongs to `SemanticDataflowFact.lineage` because one controller-scoped manifest input can contain facts contributed by multiple semantic producers:

- `route` — route parameter/controller binding;
- `controller` — scanner-backed controller/query evidence;
- `resource` — model/resource/response projection;
- `model_relation` — reserved for explicit analysis selection of model relation evidence;
- `schema` — reserved for explicit analysis selection of schema evidence.

This prevents a controller-scoped input from being misclassified as a single producer merely because the input was assembled around a controller action.

## DataFlowInterface recommendation

The upstream `DataFlowInterface` remains unchanged:

- `seed(input)`
- `derive(state)`
- `close(state)`
- `reaches(state, source, target)`

Source/sink/additional-step/barrier policy remains downstream in the analysis lane. `DataFlowFactPolicyInterface` selects facts first; `DataFlowConfigContributorInterface` then maps selected evidence into an analysis-specific configuration.

This matches the separation visible in CodeQL, where a data-flow configuration selects sources/sinks and may add flow steps/barriers while the generic data-flow machinery performs the flow computation. MLIR similarly keeps solver orchestration separate from child analyses and their transfer/dependency semantics.

## Laravel/ecommerce consequence

Eloquent model relations such as `belongsTo`, `hasMany`, and `hasOne` remain structural relation evidence. They must not become generic sources or sinks merely from their producer label. Query predicates such as `whereHas(...)`, route bindings, and resource emissions may be selected by a concrete analysis policy when that policy has an explicit security/dataflow question.
