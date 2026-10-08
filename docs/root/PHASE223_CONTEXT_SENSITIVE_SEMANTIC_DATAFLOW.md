# Phase 223 — Context-Sensitive Semantic Data-Flow

RouteSync now derives bounded call-site context for semantic value-flow.

## Principle

Context is analysis state, not semantic identity. Invocation `KnowledgeId`s form
bounded context frames so flows from different call sites need not collapse into
one global result.

## Boundaries

- canonical semantic facts remain the source of truth;
- AST, Tree-sitter, CFG, and ICFG are not semantic authorities;
- Map/Set are derived indexes/worklists only;
- context depth is explicitly bounded;
- results are conservative may-flow results.

## Relation to established analysis

The design is informed by IFDS/IDE-style interprocedural data-flow and by
CodeQL's distinction between local and global data-flow. Unlike an ICFG-based
implementation, RouteSync keeps the semantic dependency in canonical
`SemanticDataFlowFact` values and treats call-site context as a derived analysis
coordinate.
