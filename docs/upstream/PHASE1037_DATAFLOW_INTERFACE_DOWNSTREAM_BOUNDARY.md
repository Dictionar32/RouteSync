# Phase 1037 — DataFlowInterface Upstream → Downstream Boundary

## Scope

This phase traces the canonical dataflow boundary from upstream semantic producers through the closed semantic-dataflow authority to downstream policy, IR, CLI, graph, route, controller, model-relation, resource, and schema surfaces.

## Decision

`DataFlowInterface<Input, State, Node>` remains execution/query-only:

- `seed`
- `derive`
- `close`
- `reaches`

It does not absorb Laravel, route, controller, model-relation, resource, schema, graph, IR, or source/sink policy semantics.

`SemanticDataflowInterface` remains the closed semantic authority and exposes its canonical `SemanticDataflowJudgment` for downstream projections that require closed facts.

## Downstream migration

`SemanticDataflowAnalysisResult` no longer duplicates `judgment` beside `interface.judgment`.

Before:

```text
analysis.input
analysis.judgment
analysis.interface.judgment
```

After:

```text
analysis.input
analysis.interface.judgment
```

The production CLI, IR projection, fact policy, and state policy were already interface-first. Ecommerce analysis tests were migrated to consume the interface surface as well.

## Producer boundaries

- Route projection produces route-binding evidence.
- Request projection produces request/validation evidence.
- Controller projection produces controller/query evidence.
- Model relation produces structural relation evidence.
- Resource projection produces transformation/response evidence.
- Schema/migration produces database relation evidence.
- Manifest aggregates semantic seed facts only.
- The semantic dataflow authority owns fixed-point closure.
- Graph remains a structural relation projection and does not run dataflow closure.
- IR projects the closed semantic-dataflow authority and does not reconstruct closure.

## Laravel frontier

Laravel dynamic request properties first resolve request payload input and then matched route parameters. The semantic request projection should preserve that dual provenance where static evidence supports both candidates. This is a producer/projection concern, not a reason to widen `DataFlowInterface`.

Laravel validation similarly remains a semantic state transition (`raw_request` → `validated_request` → controller consumption), with policy/state configuration downstream of the generic execution interface.

## External architecture evidence

CodeQL separates generic flow execution from configuration such as sources, sinks, barriers, additional flow steps, and flow states. MLIR separates the general `DataFlowSolver` from child analyses, analysis state, dependency relations, and fixed-point execution. RouteSync follows the same separation rather than embedding framework policy into the generic interface.
