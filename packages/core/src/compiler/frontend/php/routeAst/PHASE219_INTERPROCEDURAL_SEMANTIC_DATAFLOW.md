# Phase 219 — Interprocedural Semantic Data-Flow

Phase 218 introduced versioned semantic state, inspired by MemorySSA. Phase 219 crosses the next semantic boundary: a call.

## What is elevated

The canonical model now has `SemanticCallable` knowledge containing:

- parameter identities;
- body identity;
- result/exception emission identities;
- optional semantic name.

`SemanticInvocation` does not become a control-flow node. A call target is a normal canonical data-flow dependency with role `callable`.

## Derived analysis

`semanticInterproceduralDataFlowRelations.ts` derives:

```text
invocation
   │ callable
   ▼
callable
   ├── argument[i] ───────► parameter[i]
   ├── result emission ───► invocation result boundary
   └── exception emission ► invocation exception boundary
```

The call-target index and emission index are temporary lookup structures only. They are not semantic truth.

## Why this goes beyond Tree-sitter

Tree-sitter provides syntax trees. This phase consumes semantic identities and relationships that remain meaningful even when the original syntax representation changes. The architecture therefore follows the same broad direction seen in CodeQL global data flow, MLIR data-flow lattices/solvers, WALA interprocedural analysis, SootUp IFDS, SVF sparse value-flow, and Joern's multi-layer code property graph, while retaining RouteSync's stricter rule that semantic facts—not graph/control-flow containers—are canonical.

CodeQL explicitly models global flow across functions and fields; MLIR models analysis state as lattice values propagated by a solver; WALA and SootUp provide interprocedural analysis infrastructure; SVF models sparse interprocedural def-use/value-flow; Joern combines multiple program representations and supports higher-level overlays.

## Precision contract

Phase 219 intentionally reports **may-flow**. It does not claim:

- exact dynamic dispatch;
- nearest reaching call target;
- execution order;
- dominance/post-dominance;
- exception path certainty.

Those properties require additional evidence/analysis layers. They must refine the semantic data model rather than replacing it.

## Evidence vocabulary correction

The canonical evidence vocabulary already permits `compiler_ir` and `runtime_metadata`; the Phase 219 checkpoint also exposes both in the semantic provider catalog. This keeps the model internally consistent with the multi-source architecture: parser/lexer evidence is not privileged as the only route to semantic facts.
