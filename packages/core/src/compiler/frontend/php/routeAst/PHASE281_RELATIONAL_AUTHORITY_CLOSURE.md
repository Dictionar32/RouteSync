# Phase 281 — Relational Authority Closure

Phase 281 removes the remaining compatibility implementation that represented
source control constructs as semantic knowledge.

## Canonical boundary

```text
source syntax
  -> syntax/evidence projection
  -> typed semantic relations
  -> declarative relation program
  -> constraint/rewrite solver
  -> fixed-point closure
  -> proof-carrying lowering
```

The canonical semantic layer contains no construct-shaped authority for
selection or repetition. Concrete PHP statement spellings remain confined to
the syntax/evidence boundary.

## Removed

The obsolete `routeAst/legacy` compatibility tree was removed. It previously
contained the historical control ontology, control relation projector, and the
older generic semantic rule interpreter.

The old Phase 213 test was migrated to assert the canonical relational program
instead of importing historical control types.

## Research alignment

The design follows the separation demonstrated by Tree-sitter's syntax tree
model, Soufflé's relation/rule model, MLIR's declarative pattern rewriting,
and K's rewrite-based semantic model. The RouteSync semantic authority is the
relation program and its fixed-point solver; parser constructs are evidence,
not semantic categories.
