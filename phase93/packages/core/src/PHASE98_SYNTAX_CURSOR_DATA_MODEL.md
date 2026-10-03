# Phase 98 — Syntax Cursor Data Model

## Principle

`i + 1`, `i + 2`, `i += 1`, and direct `tokens[index]` access are not Laravel knowledge. They are implementation details of syntax traversal.

The lexer therefore gets a dedicated `TokenCursor` abstraction. The cursor owns positional arithmetic; parser code consumes named traversal relations:

- `current`
- `previous`
- `next`
- `afterNext`
- `advance()`
- `find(...)`
- `until(...)`
- `collectTo(...)`

This keeps positional arithmetic below the parser's semantic boundary.

## Boundary

```text
PHP source
  ↓
AST/token stream
  ↓
TokenCursor               ← owns positional arithmetic
  ↓
syntax facts / RouteAst
  ↓
semantic ADT
  ↓
dumb flow
```

The cursor does **not** interpret Laravel. It is a syntax-navigation model only.

## Data-loss invariant

Traversal must not turn:

- absent → empty
- unsupported → dropped
- expression → string
- identity → position
- unknown → fabricated datum

## Laravel grounding

Laravel 13 routing exposes route groups, bindings, constraints, resource routes, middleware, and route metadata as declarative route configuration. Those concepts belong in the semantic model; numeric token positions do not. The lexer only reconstructs syntax facts before semantic resolution.

## Audit target

The remaining lexer migration should progressively replace raw `tokens[i + N]` access with `TokenCursor` relationships. The private cursor position may still use numeric arithmetic internally because that arithmetic is the implementation mechanism of traversal, not exposed knowledge.
