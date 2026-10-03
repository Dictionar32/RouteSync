# Phase 220 — Semantic Property/Object Data-Flow

RouteSync now models object/member value-flow above syntax.

## Semantic chain

```text
SemanticAssignment(target = SemanticAccess)
        ↓
property write
        ↓
semantic receiver + semantic member identity
        ↓
property read (SemanticAccess)
        ↓
may value-flow
```

This is deliberately not a Tree-sitter property-node analysis. The canonical
inputs are `SemanticAssignment` and `SemanticAccess` facts. Tree-sitter, parser,
lexer, framework metadata, reflection, compiler IR, or runtime metadata can
provide evidence for those facts, but none is the semantic source of truth.

The analysis is conservative: without execution ordering, it reports possible
write-to-read flow rather than claiming the nearest or definitely reaching write.
`Map` is only a derived lookup/index structure.

## Why this matters

CodeQL's global data-flow implementation explicitly models flow through field
writes and reads and matches call-sites with returns. MLIR provides a generic
fixed-point data-flow solver and lattice framework. Joern's code property graph
uses layered overlays to host multiple abstraction levels. RouteSync now takes
the useful semantic idea while keeping its own typed knowledge model canonical.
