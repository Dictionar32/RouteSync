# Phase 1041 — Interface Dependency Boundary: Upstream => Downstream

Phase 1041 formalizes the dependency direction around the canonical
`DataFlowInterface` without making every upstream producer implement or import
a downstream interface.

## Boundary

```text
Route / Controller / Request / ModelRelation / Resource / Schema / Manifest
                             |
                             | semantic evidence / input
                             v
                  SemanticDataflowInput
                             |
                             v
                  DataFlowInterface
                             |
          +------------------+------------------+
          |                  |                  |
          v                  v                  v
       AST consumer       IR consumer       Policy consumer

Structural graph lane:
Schema / ModelRelation / Route / Controller / Resource
                             |
                             v
                 StructuralSemanticRelation
                             |
                             v
                      GraphEdgeRelation
                             |
                             v
                        ServiceGraph
```

## Rules

1. `DataFlowInterface` is the sole generic dataflow execution/state contract.
2. Upstream producers emit evidence or `SemanticDataflowInput`; they do not
   depend on downstream projection/consumer interfaces.
3. `InterfaceDependencyBoundary<Upstream, Downstream>` is the type-level
   direction marker: the downstream contract depends on the upstream value.
4. `DataFlowProjectionInterface` specializes that boundary for materialization.
5. IR consumes the generic `DataFlowInterface` and reads canonical `state`.
6. Graph remains on the structural relation lane and does not become a
   dataflow solver merely to satisfy interface uniformity.
7. `SemanticDataflowInterface` remains the canonical semantic authority/factory
   surface, but production downstream consumers do not reclassify through it.

## Upstream reference alignment

CodeQL separates source/sink/barrier/additional-flow-step configuration from
its dataflow engine and exposes flow as a query over the analysis result.
MLIR's `DataFlowSolver` owns fixed-point execution/state and consumers query
analysis state. LLVM's new pass manager similarly separates analysis results
from downstream passes. RouteSync follows the same dependency direction while
using TypeScript interfaces instead of reproducing those systems literally.
