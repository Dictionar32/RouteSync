# Phase 185 — Semantic Data-Flow Beyond Syntax

## Principle

RouteSync does not treat Tree-sitter, PHP AST, or any other parser representation as the semantic source of truth.

The parser is evidence. The canonical representation is typed knowledge plus typed data-flow.

## Elevation

- `if`, `while`, `for`, `foreach`, `switch`, `match`, and ternary syntax are evidence that can produce semantic `choice`, `repetition`, `match`, `predicate`, and `outcome` facts.
- `===` and `!==` are evidence for operator meaning such as `identical` and `not_identical`.
- Repetition exposes `predicate`, not a semantic `condition` field.
- Choice alternatives expose `predicates`, not syntax-shaped `conditions`.
- Data-flow roles use semantic concepts (`predicate`, `subject`, `candidate`, `alternative`) rather than parser/control-flow vocabulary (`branch_condition`, `match_candidate`, etc.).
- Derived graph edges retain the semantic data-flow role so graph/index projections do not erase knowledge.
- `Map`/`Set` remain derived validation/index structures and never decide which knowledge facts exist.

## Consequence

A different parser or source language can feed the same semantic model as long as it can provide equivalent evidence and provenance. The semantic model does not require Tree-sitter node names.
