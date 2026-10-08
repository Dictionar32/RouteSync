# Phase 160 — Knowledge/Data-Flow Escalation Audit

## Principle

RouteSync treats typed knowledge/data-flow as the semantic source of truth. Tree-sitter/PHP syntax is evidence only; parser branches are interpreters, not semantic storage.

## Escalation implemented

The control-flow knowledge vocabulary now represents:

- comparison operators: `==`, `!=`, `===`, `!==`, `<`, `>`, `<=`, `>=`
- conditions
- branches (`if` / alternatives)
- iterations (`while`, `foreach`, `for`)
- selections (`switch`, cases, default, fall-through)
- exceptions (`try`, catches, finally)
- transitions (`return`, `throw`)
- PHP 8 `match` expressions and their arms
- typed knowledge relations for branch, iteration, selection, exception and transition flow

`Map`/index structures remain derived accelerators. Facts, relations and knowledge graph nodes are the source of truth.

## Important semantic preservation

A missing `else` remains `KnowledgePresence<'absent'>`; it is not converted into an empty block. A missing `switch default` remains absent. A `for` initializer/condition/update remains a `PhpForClause` datum rather than being coerced to a `PhpAstValue`.

PHP documents `switch` as loose case comparison with fall-through until `break`; this is represented by `SelectionCase.fallThrough`. PHP `match` is represented separately because it uses identity comparison (`===`), returns a value, has no fall-through, and is exhaustive. These are language semantics, not Tree-sitter node mechanics.

## Evidence boundary

Tree-sitter provides syntax-tree nodes and named fields for structural analysis; RouteSync elevates those observations into typed semantic facts above that boundary.

## Remaining elevation

Source-file provenance is still `<php-source>` at the controller-body parser boundary. The next correct change is to pass the actual source path from the scanner entry point into the producer rather than inventing a path in the knowledge layer.

The next semantic vocabulary candidates are `break`, `continue`, `goto`, `include/require`, nullsafe access, null-coalesce, ternary/short-ternary, and expression-level data-flow transitions. They should reuse the same knowledge graph rather than create independent analyzer control-flow.
