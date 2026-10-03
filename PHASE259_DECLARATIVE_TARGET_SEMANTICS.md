# Phase 259 — Declarative Target Semantic Relations

Phase 259 continues the semantic-control elevation from Phase 258.

## Scope

Two remaining semantic dispatch points were converted from procedural `switch` logic to declarative relation catalogs executed by the existing semantic relation solver:

1. `PrimitiveKind -> TypeScript primitive token`
2. `ResponseValueContract kind -> response output type`

## Architecture

```text
semantic evidence
  ↓
semantic relation facts
  ↓
declarative rewrite rules
  ↓
relation solver / fixed-point execution
  ↓
semantic projection
  ↓
existing constructor / emitter mechanics
```

The solver remains the execution mechanism. It does not own domain meaning.

## Explicit boundary

Remaining `if`/`for`/`while` statements in compiler infrastructure are not automatically targets. Queue traversal, validation, collection traversal, and graph algorithms remain mechanical. The target is semantic knowledge encoded as control-flow rather than as typed relations/rules.

## External grounding

MLIR PDLL separates pattern matching from rewriting and represents rewrite patterns declaratively. MLIR's pattern rewriter similarly separates pattern definition from pattern application. LLVM MemorySSA models state through definitions, uses, and phi/version relations. CodeQL documents that data-flow graphs model semantic runtime value flow rather than AST control syntax.

3. `ResolvedSemanticType kind -> TypeScript lowering operation`

The lowering operation is selected by declarative relation facts. The handler registry is only an execution projection; semantic classification is not implemented by a `switch`.
