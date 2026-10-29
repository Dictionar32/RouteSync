# Phase 216 — Semantic State/Data-Flow Beyond Syntax

## Site-derived design direction

The design is informed by LLVM MemorySSA, MLIR sparse data-flow analysis, CodeQL data-flow graphs, and SootUp's separation of IR/call graph/data-flow analysis.

- LLVM MemorySSA represents memory with `MemoryDef`, `MemoryUse`, and `MemoryPhi`, with def-use/use-def relationships over state versions.
- MLIR data-flow analysis propagates lattice state with transfer functions and joins; the lattice is the analysis state rather than syntax.
- CodeQL explicitly separates data-flow nodes from AST nodes and supports local/global flow.
- SootUp separates IR, call graph, and interprocedural data-flow analysis.

## RouteSync adaptation

RouteSync does **not** copy CFG/LLVM MemorySSA as its semantic source of truth.

The canonical model remains:

```text
syntax/framework/runtime evidence
        ↓
SemanticFact + SemanticDataFlowFact
        ↓
SemanticStateDataFlow (derived analysis)
        ↓
possible def-use / merge relations
        ↓
consumer/interpreter
```

### State locations

A state location is typed as either:

- `variable`
- `member(receiver, member)`

Assignments become `state-def` accesses and references/property accesses become `state-use` accesses. Existing `SemanticMerge` facts become `state-merge` accesses.

### Important precision boundary

This phase intentionally derives **possible** def-use relations by semantic location. It does not claim a nearest/reaching definition because the syntax-independent model has no execution ordering or CFG. That precision belongs to a later analysis layer.

This prevents a false abstraction where an implementation detail such as source order is silently promoted into semantic truth.

### Map/Set rule

`Map`/`Set` are used only as indexes/worklists inside the analysis. They are never the source of semantic state.

```text
canonical facts → analysis indexes → derived results
```

not:

```text
Map → semantic meaning
```
