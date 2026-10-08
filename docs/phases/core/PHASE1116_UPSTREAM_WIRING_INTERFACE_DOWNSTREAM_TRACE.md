# Phase 1116 — Upstream → Wiring → Interface → Downstream Trace

## Canonical path

`types/upstream/typeVocabulary` is the canonical type-expression vocabulary. Semantic type construction is owned by `types/domain/semanticType`; compiler lowering remains downstream.

```text
source evidence
  -> types/upstream
  -> types/domain semantic vocabulary
  -> compiler/scanner/wiring
  -> generic interfaces
  -> graph / dataflow / IR
  -> CLI commands
  -> ecommerce fixture
```

## Boundary invariants

- `types/upstream` has no production `compiler/*` imports.
- `types/domain` has no production `compiler/*` imports.
- IR and semantic consumers do not import `compiler/types/SemanticType`.
- Public `core` exports canonical semantic types from `types/domain/semanticType`.
- `DataFlowInterface` remains generic; Laravel source/sink/barrier policy stays in analysis configuration.
- `InterfaceDependencyBoundary<Upstream, Downstream>` remains directional and downstream-owned.
- Graph and IR remain projections rather than semantic authorities.
- `StaticLaravelScanner` and `scanner/upstream` have no production references.
- CLI commands consume the package surface rather than core source paths.
- Ecommerce fixture remains the route/controller/model-relation/resource/schema regression oracle.

## External architectural references

MLIR documents interfaces as a mechanism for generic transformations and analyses without encoding concrete dialect knowledge. CodeQL separates its data-flow graph representation from AST nodes and models sources, sinks, barriers, and additional flow steps through a generic solver. These patterns support keeping RouteSync's semantic authority upstream and its concrete projections downstream.
