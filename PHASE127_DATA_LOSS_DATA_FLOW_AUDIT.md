# Phase 127 — Data-Loss / Data-Flow Model Audit

## Scope

Audit continued from Phase 126 over `packages/core/src/compiler/scanner/lexer/routeAst` with the explicit targets:

- `??`, ternary, `if`, `switch`, `while`
- positional arithmetic such as `i + 1`, `i + 2`, `i + 123`
- numeric token indexing
- `undefined` / `null` as semantic absence
- `Record` vocabulary used as hidden domain knowledge
- `===` / `!==` where they encode syntax/domain facts
- data-flow provenance and cardinality loss

## Implementation

`routeDataFlow.ts` was raised from value-only facts to cardinality-aware facts and edges.

Each `RouteDataFlowFact<T>` now carries:

- `kind`
- `value`
- `cardinality: empty | non_empty`
- provenance (`producer`, `model`, `consumer`)

Each `RouteDataFlowEdge` now carries the same cardinality information. Cardinality is supplied explicitly by the producer rather than inferred through a ternary/control-flow branch.

This makes the distinction explicit between:

1. a fact that exists and contains an empty collection, and
2. a fact that was accidentally dropped.

Route and group constraints remain append-only and preserve their source (`route` or `group`).

## Validation

- routeAst TypeScript transpilation: PASS (11/11 files)
- `??`: 0
- `null` literal: 0
- `switch`: 0
- `indexOf`: 0
- `findIndex`: 0
- numeric `[0]` / `[1]` indexing: 0
- positional `+1/+2/+123` outside `TokenCursor`: 0
- positional negative arithmetic outside navigation primitives: 0
- ternary conditional expressions in `routeDataFlow` and `routeSyntaxModel`: 0
- `if` / `switch` / `while` in `routeSyntaxModel`: 0
- `if` / `switch` / `while` in `routeDataFlow`: 0

## Remaining control flow classification

`while` remains in `TokenCursor`, `SyntaxRange`, and the parser scanning engines. These are traversal/execution mechanisms. Positional arithmetic remains confined to `TokenCursor` and delimiter-stack navigation.

`===` / `!==` remains in syntax predicates and type guards. These are not parser branching that stores Laravel knowledge; they are structural predicates used to identify token shapes and discriminated values. The remaining occurrences are therefore tracked as predicates rather than treated as data-loss by themselves.

Optional TypeScript properties and optional route binding syntax (`?`) are not conditional expressions and are not counted as ternary data loss.

## External architecture alignment

Tree-sitter recommends named fields for syntax children instead of positional access and exposes navigation through named-child/field APIs. This supports keeping positional traversal inside a navigation abstraction while semantic consumers operate on named relations.

Laravel 13 documents that nested route groups merge middleware and `where` conditions, while prefixes and names are appended. The model therefore preserves group facts and constraint cardinality instead of replacing them with a single latest value.
