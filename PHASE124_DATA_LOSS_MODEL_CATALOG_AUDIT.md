# Phase 124 — Data-Loss / Closed Catalog / Control-Flow Audit

## Rule

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

Phase 123 identified remaining open `Record<string, T>` catalogs and a parser-level `switch` that still encoded constraint-shape knowledge.

## Implemented elevation

### 1. Closed syntax catalogs

`routeSyntaxModel.ts` no longer uses open `Record<...>` catalogs for Laravel vocabulary. Route methods, constraint methods, resource methods, route-path policies, resource middleware policies, target-method resolvers, group operations/transitions, group pending facts, and target AST builders are represented as closed catalog entries.

This makes the vocabulary itself inspectable data rather than an implicit set of object properties.

### 2. Constraint presence model

`routeConstraintFact()` now returns the existing `Presence<T>` ADT rather than `T | undefined`.

Group constraint extraction consumes that presence directly, preserving absence as an explicit fact and preventing accidental fallback to an empty/other constraint.

### 3. Constraint AST strategy

The parser's `switch (argument.kind)` was removed. Constraint AST construction is now selected through the declarative constraint-argument builder catalog in `routeSyntaxModel.ts`.

### 4. Resource middleware catalog

`routeResourceDeclarationAst.ts` no longer uses an open `Record` for middleware builders. The builder vocabulary is an explicit catalog.

### 5. Data-loss guard

The audit found no new `??`, conditional-expression ternary, numeric token indexing, `indexOf`, `findIndex`, or negative slice in the route-AST target set.

The route target fallback to closure remains a semantic concern for a future dedicated target-presence phase: it is not changed mechanically here because closure/controller target classification needs a complete target-expression ADT rather than another sentinel.

## Traversal boundary

Positional arithmetic remains private to `TokenCursor`; delimiter-stack arithmetic remains in `delimiterNavigation.ts`. This matches Tree-sitter's separation of traversal from named syntax fields: consumers should use named relations/fields instead of encoding child position as domain knowledge. citeturn0search3turn0search5

Laravel 13 documents that nested route groups merge middleware and `where` conditions, while prefixes and names are appended. The RouteSync group model therefore retains multi-value facts and does not overwrite them with absence. citeturn0search0

## Static validation

- route-AST TypeScript transpile: PASS
- `??`: 0
- conditional expressions (`?:`): 0
- `switch`: 0
- open `Record<...>` catalogs in `routeSyntaxModel.ts`: 0
- `[0]` / `[1]`: 0 in target audit
- `indexOf` / `findIndex`: 0 in target audit
- token positional arithmetic outside navigation primitives: 0
- temporary/backup files: 0

Remaining `while`/`if` occurrences are confined to traversal primitives, parser execution/guards, or delimiter mechanics. They are not being used as the Laravel knowledge store.

## Validation limitation

This is a phase-focused source/transpile audit. It does not claim a full repository typecheck/test pass because the checkpoint's complete dependency/type-definition environment is not available.
