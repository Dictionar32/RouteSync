# Phase 426 — Scanner/Resolver Relational Catalog Cutover

## Scope
- relational sequence kernel positional recursion
- query resolver operation catalog
- query resolver expression-argument catalog

## Changes
- kernel recursive cursors use `relationAdvanceIndex` rather than host positional arithmetic
- operation catalog is an immutable relation of tuples rather than `ReadonlyMap`
- expression-argument catalog is an immutable relation of tuples rather than `ReadonlyMap`
- catalog lookup uses `relationLookup`

## Boundary rule
PHP operator spellings remain source-language data. They are not treated as TypeScript control operators.

## Validation
Target files transpile with zero TypeScript transpile diagnostics.
