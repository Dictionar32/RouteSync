# Phase 227 — Semantic Heap Abstraction & Memory Versioning

## Purpose

Add a heap/object-location abstraction and memory-version overlay above canonical RouteSync semantic knowledge.

## Research basis

LLVM MemorySSA models memory with `MemoryDef`, `MemoryUse`, and `MemoryPhi`, and describes this as a virtual overlay that versions memory. LLVM Alias Analysis separately answers Must/May/No alias queries. MLIR provides sparse forward/backward data-flow lattices. These ideas motivate the analysis layer here, but RouteSync does not adopt LLVM IR instructions, basic blocks, dominance, or CFG nodes as semantic ontology.

## RouteSync model

```text
canonical semantic facts
        ↓
object identity / alias
        ↓
heap region
        ↓
memory effect
        ↓
heap version
        ├── entry
        ├── write
        └── merge
        ↓
read candidate
```

### Heap region

A heap region groups receivers connected by explicit alias evidence. The grouping is derived and may-alias; unknown receivers are not declared NoAlias merely because their syntax differs.

### Versions

- `entry`: no semantic write candidate was established for a read.
- `write`: derived from a semantic memory writer.
- `merge`: multiple may-write candidates feed a read.

The analysis never claims a nearest reaching write because execution ordering/dominance is not canonical RouteSync knowledge.

## Source-of-truth rule

`SemanticFact` and `SemanticDataFlowFact` remain canonical. Heap regions, aliases, versions, maps, and merge indexes are derived analysis artifacts.
