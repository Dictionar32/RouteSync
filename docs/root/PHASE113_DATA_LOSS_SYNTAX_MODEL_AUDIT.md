# Phase 113 — Data-Loss / Syntax-Model / Traversal Audit

## Scope

This phase continues Phase 112 without reintroducing positional parsing. The audit covers:

- `??` fallback sites in the scanner;
- raw positional arithmetic and numeric indexing;
- semantic `if`/`while` used as a place to store Laravel syntax knowledge;
- preservation of multi-value Laravel route/resource syntax;
- alignment of traversal with the `TokenCursor` / `SyntaxRange` navigation model.

## Findings

### 1. Data-loss fallback audit

Scanner-wide `??` search: **0 occurrences**.

The earlier semantic fallbacks that could collapse an absent relation into a guessed value are not used in the route-AST scanner. Presence remains represented through named relations and `SyntaxPresence`.

### 2. Traversal arithmetic boundary

Raw positional arithmetic remains only inside the syntax-navigation primitives:

- `tokenCursor.ts`: previous/next/afterNext/terminal/advance;
- `delimiterNavigation.ts`: delimiter-stack boundary arithmetic.

No parser or semantic consumer owns raw token-position arithmetic. This is the intended navigation boundary.

### 3. Numeric/index-based syntax selection

The route-AST tree has no numeric `[0]` / `[1]`, `indexOf`, or `findIndex` syntax-selection sites.

Named navigation is used instead: `firstCallArgumentSpan`, `callTrailingArgumentSpans`, `firstDelimitedElementCursor`, `secondDelimitedElementCursor`, and relation-specific cursor accessors.

### 4. Laravel syntax knowledge moved into declarative strategies

`routeSyntaxModel.ts` was tightened so syntax meaning is selected by catalogs rather than parser control flow:

- route path-token policy is a method catalog;
- resource middleware argument ownership is a method policy catalog;
- route target method resolution is a method resolver catalog;
- route constraint extraction is a constraint strategy catalog;
- middleware scope remains a declarative method-to-scope catalog.

The model file itself contains **no `if` or `while` statements**.

The remaining conditionals elsewhere are execution/validation mechanisms or primitive syntax-navigation implementation, not the Laravel method vocabulary itself.

## Data-loss preservation cases

### `match([...])`

All resolvable method entries in the array are collected and deduplicated without selecting only the first element. An empty/unresolved list is not replaced by a guessed method.

### `middleware([...])`

All argument spans contribute middleware values.

### `middlewareFor([...], [...])`

The first named argument span is represented as `actions`; all trailing argument spans are represented as middleware. This uses the navigation model's first/trailing relations rather than positional arithmetic.

### `withoutMiddlewareFor([...], [...])`

The same first/trailing relation model preserves multiple actions and multiple middleware values.

### `where(...)` / `whereIn(...)`

Constraint syntax is selected through `ROUTE_CONSTRAINT_STRATEGIES`. `whereIn` preserves all array elements rather than reducing the argument to one value.

## External architecture alignment

Tree-sitter explicitly supports named fields so consumers can access children by semantic name instead of ordered position. Its parser/navigation documentation also separates named syntax nodes from anonymous tokens and exposes field-based navigation. This supports keeping positional arithmetic behind a navigation abstraction rather than distributing it across consumers.

Laravel 13.x documents route groups, resource middleware, `middlewareFor`, and `withoutMiddlewareFor` as semantic route configuration operations. The implementation therefore keeps these operations as syntax-model facts instead of encoding their meaning as scattered parser branches.

## Validation

- Route-AST TypeScript transpilation: **PASS**.
- Scanner-wide `??` audit: **0**.
- Route-AST numeric syntax-index audit: **0**.
- Route-AST `indexOf` / `findIndex` audit: **0**.
- Route-AST raw positional arithmetic outside navigation primitives: **0**.
- `routeSyntaxModel.ts` `if`/`while` audit: **0**.
- temporary/backup files under `phase93`: **0**.

A full repository typecheck/test pass is not claimed because the workspace environment does not provide all repository dependencies/type definitions required by the complete project build.

## Architectural rule retained

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

`if`/`while` may remain where they implement generic execution, validation, or primitive traversal. They must not be the storage location for Laravel syntax knowledge that can be represented by a typed relation, catalog, fact, strategy, or navigation model.
