# Phase 1157 — Upstream/DataFlow Interface Strengthening

## Direction

Laravel source evidence -> CompleteLaravelSourceModel -> upstream semantic dataflow evidence/input -> semantic judgment/closure -> generic DataFlowInterface -> analysis/IR.

Structural lane remains separate:

Laravel route/controller/model relation/resource/schema -> StructuralSemanticRelation -> GraphEdgeRelation -> ServiceGraph.

## Strengthening

- `DataFlowInterface<Input, State, Node>` remains the generic downstream execution/state/query contract.
- Upstream owns semantic dataflow meaning, evidence, input construction, and closure.
- The dataflow adapter does not reclassify semantic input or rebuild closure.
- Assignment and request ADT visitors now use discriminant narrowing instead of `Extract<...>` casts.
- Resource-route empty sequences now use a typed constructor instead of assertions.
- Root and ecommerce frontend TypeScript configurations use stronger TS7-era strictness including exact optional properties, unchecked indexed access, unused checks, isolated modules, and verbatim module syntax.
- `isolatedDeclarations` remains enabled at the root compiler boundary.

## External compiler-model alignment

MLIR separates generic solver orchestration from child analysis semantics and uses interfaces to avoid operation-specific special cases. CodeQL similarly models data flow as a semantic graph distinct from AST syntax and lets analysis configuration define sources, sinks, barriers, and additional flow edges.

RouteSync follows the same separation: upstream supplies semantic facts; the generic dataflow contract supplies execution/query mechanics; IR and graph projections consume established facts instead of reconstructing domain meaning.
