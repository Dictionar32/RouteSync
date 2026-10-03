# Phase 260 — Declarative Upstream Expression Semantics

## Goal

Raise upstream expression semantic mapping above procedural `if`/`switch` dispatch.

## What changed

`resourceUpstreamExpressionMappings.ts` now delegates semantic classification to
`resourceSemanticMappingRelations.ts` and the shared declarative relation solver.

The relation program covers:

- binary operator semantics
- unary operator semantics
- cast semantics
- assignment operator semantics
- assignment reference mode
- literal kind
- static receiver/action semantics
- argument kind
- array entry/key kind
- assignment target kind
- destructuring entry kind
- static property owner kind
- parameter type kind and primitive projection
- property/method access mode

The remaining constructor tables are derived indexes/handlers. They do not define
semantic meaning; the relation program does.

## Boundary rule

Parser/lexer facts remain evidence. Semantic meaning is produced by relation
rewrites. Traversal and constructor invocation remain mechanics.

## Validation

- Focused TypeScript compile: PASS
- Target mapping module: 0 `switch`
- Target mapping module: no semantic `if` dispatch
- Full workspace compile/runtime: not claimed; existing dependency/runtime environment
  prevents a complete workspace test from being treated as authoritative.
