# Phase 226 — Semantic Memory Dependence

RouteSync now has a memory-dependence overlay derived from canonical semantic
knowledge, inspired by LLVM AliasAnalysis/MemorySSA, WALA heap models, and
SootUp points-to analysis.

## Principle

Canonical truth remains `SemanticKnowledgeDataFlow`. Memory locations,
effects, alias results, and dependencies are derived analysis artifacts.

```text
semantic assignment/access
        ↓
semantic memory location
        ↓
object identity / alias analysis
        ↓
read/write effects
        ↓
may memory dependence
```

No AST instruction, basic block, CFG edge, or Tree-sitter node is part of the
canonical memory model.

## Conservative semantics

A read is connected to a write only when:

- the semantic member identities match; and
- receiver identities are proven `must-alias` or `may-alias`.

Unknown aliasing is not silently converted into a dependency. The result is a
may-dependence overlay, not an exact nearest-clobber claim.

## Why this matters

This creates a RouteSync equivalent of a lightweight semantic memory layer:
property flow can now reason about object identity before connecting a write to
a read. A future memory-version layer can consume these dependencies without
making MemorySSA, LLVM IR, or CFG the semantic authority.
