# Phase 217 — Sparse Semantic Data-Flow Beyond Syntax

## Principle

RouteSync does not make Tree-sitter, AST, CFG, or statement traversal the semantic source of truth.

Canonical knowledge is represented by typed facts and `SemanticDataFlowFact` relations. The sparse analyzer consumes those facts and derives propagation state.

```text
syntax / framework / compiler evidence
        ↓
semantic facts + canonical data-flow
        ↓
sparse propagation state
        ↓
derived analysis
```

## Why sparse

A pairwise scan of every definition against every use creates relationships that may not be represented by canonical flow. Sparse propagation visits only nodes connected by explicit data-flow facts. This follows the general direction of sparse data-flow frameworks such as MLIR's sparse forward analyses.

## What remains non-canonical

`Map`, `Set`, and the work queue are solver indexes/state. They are not semantic knowledge. No AST node, CFG edge, or syntax construct is stored as the reason for a semantic relation.

## Precision boundary

This phase does not claim nearest reaching definitions or exact execution order. Those require additional ordering/path analysis. The sparse state therefore represents derived possible propagation, not an asserted execution trace.

## External grounding

LLVM MemorySSA models memory state with `MemoryDef`, `MemoryUse`, and `MemoryPhi` and exposes def-use/use-def reasoning. MLIR provides sparse forward data-flow analysis over SSA values. CodeQL separates its data-flow graph from the AST and notes that `if` statements are control-flow constructs rather than value-carrying data-flow nodes.
