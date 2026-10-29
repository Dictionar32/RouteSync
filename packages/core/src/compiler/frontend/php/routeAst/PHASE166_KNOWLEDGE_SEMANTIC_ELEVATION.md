# Phase 166 — Semantic Meaning Elevation

## Principle

Control-flow syntax is evidence, not ontology. Semantic facts must describe meaning and data dependencies, not reproduce the parser's statement taxonomy.

## Changes

- Iteration no longer models `foreach` as a fake predicate.
- `for` now carries optional initializer, condition, and update knowledge.
- Empty `for` conditions do not create invented `unknown` data.
- Unary and binary operators use the same typed operator catalog.
- Opaque expressions are explicitly typed instead of being represented by an `unknown` semantic kind.
- Foreach targets become knowledge facts and are connected through `produces`.

## Data-flow invariant

Every relation connects real knowledge identities. A relation must express a semantic dependency, production, selection, re-entry, or transformation; statement order is never a relation.

## Boundary

Tree-sitter/PHP AST is syntax evidence. The semantic model is the source of truth. Indexes are derived accelerators.
