# Phase 1128 — Graph Implementation Ownership

Direction: `upstream => wiring => interface => downstream`

The graph implementation no longer imports `GraphEdgeRelation` through the compatibility surface `types/semantic/modelGraphTypes.ts`. Graph implementation files consume the graph-owned contract directly from `graph/service/graphEdgeRelation.ts`.

`types/semantic/modelGraphTypes.ts` retains only a deprecated type alias for compatibility. `types/semantic/serviceGraphTypes.ts` also points directly at the graph-owned contract.

This preserves the ownership chain:

```text
upstream SemanticRelation
  -> wiring / structural projection
  -> graph-owned GraphEdgeRelation contract
  -> graph assembler / sink / ServiceGraph
```

`DataFlowInterface<Input, State, Node>` remains generic and unchanged. `InterfaceDependencyBoundary<Upstream, Downstream>` remains generic and downstream-owned.

The deprecated `semanticDataFlowAnalyzer.ts` remains test/compatibility-only and has no production consumers; it is not a semantic authority.
