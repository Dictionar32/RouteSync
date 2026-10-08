# Phase 965 — Laravel route-parameter flow enters canonical dataflow

The Laravel route/controller boundary now contributes only proven value-flow facts to the canonical upstream dataflow input.

## Canonical path

`RouteHighLevelContract.bindings.parameters` → matching `ControllerParameter(kind=route_parameter)` → `SemanticDataflowFact(kind=value_flow, role=binding)` → `SemanticDataflowInput` → `SemanticDataflowJudgment` → least-fixed-point closure → `SemanticDataflowInterface`.

The projection matches route/controller targets by canonical controller/action references and parameter names. Route policy, middleware, resource expansion, and generic route semantics remain owned by their existing upstream contracts; they are not reclassified as value-flow.

## Laravel fixture

`examples/ecommerce-shop-source` contains concrete route parameters such as `{id}`, `{produkItemId}`, `{orderId}`, and `{provider}`. Controller signatures contain corresponding `route_parameter` controller parameters for the applicable actions. The source therefore provides real evidence for route-to-controller value flow.

The fixture does not establish implicit Eloquent model binding for these scalar parameters, so this phase does not invent model-binding facts. If a future source has `RouteParameter.binding = implicit_model` or `explicit`, that existing upstream binding contract can remain provenance for the same canonical flow.

## Control-flow boundary

This phase does not move compiler CFG machinery into semantic dataflow. Basic blocks, dominators, SSA, loops, and optimization remain compiler infrastructure. Only semantic value/control-condition knowledge is represented by the canonical dataflow fact algebra.

`routeDataFlow.ts` remains a scanner construction compatibility surface; its graph has no production consumer and is not the semantic dataflow authority.
