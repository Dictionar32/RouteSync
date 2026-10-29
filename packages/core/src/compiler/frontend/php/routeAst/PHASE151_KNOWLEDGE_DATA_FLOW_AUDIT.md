# Phase 151 — Knowledge/Data-Flow Beyond Tree-sitter

## Trace finding

`if`, `switch`, `while`, `===`, and `!==` are not semantic targets. They are source-level mechanisms/evidence. The semantic target is a model of facts, states, relations, transitions, cardinality, and data-flow.

## Applied elevation

- Laravel resource action semantics are represented by `RESOURCE_ACTION_KNOWLEDGE`.
- Action -> HTTP methods, path role, parameter role, and capability are data.
- Resource naming rules are represented by `RESOURCE_NAME_KNOWLEDGE`.
- Shallow/nested item-path selection is represented by a value relation instead of an action branch.
- The existing `KnowledgeFlow` model remains above the syntax substrate; `if`/`while`/`switch` are not its vocabulary.
- Runtime loops that remain in sequence/cursor interpreters are mechanics for interpreting already-materialized data, not Laravel knowledge.

## Boundary

Tree-sitter provides concrete syntax nodes, fields, node types, and queries. RouteSync's semantic/data-flow model must not stop at those node categories. Laravel routing concepts such as resource actions, constraints, groups, middleware, and model binding belong to the higher semantic model.
