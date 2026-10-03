# Phase 128 — Data Loss / Data-Flow / Syntax Navigation Audit

## Scope

Audit dilanjutkan dari Phase 127 dengan target:

- data loss melalui `??`, `undefined`, `null`, empty/default collapse;
- `if`, `switch`, `while`, ternary sebagai tempat penyimpanan pengetahuan;
- `Record` sebagai implicit vocabulary map;
- positional arithmetic/indexing di luar syntax-navigation primitive;
- provenance dan cardinality pada data-flow.

## Implemented

### 1. Presence-preserving call arguments

`TokenCursor.callArgumentSpansPresence` membedakan:

- call tidak memiliki opening/closing structure → `absent`;
- call valid dengan zero arguments → `present([])`;
- call valid dengan arguments → `present(spans)`.

Parser/model consumers can therefore distinguish malformed/missing structure from an intentionally empty collection.

### 2. Delimiter knowledge raised to ADT/catalog

`delimiterNavigation.ts` no longer stores delimiter vocabulary in `Record` or selects delimiter meaning with `if` statements.

The model now exposes `DelimiterRelation`:

- `opening(token, close)`
- `closing(token, open)`
- `other`

Traversal consumes this relation. Stack mutation remains execution mechanics.

### 3. Catalog lookup cleanup

`routeSyntaxModel` no longer extracts catalog values through `Object.entries`/record-shaped vocabulary. Catalog lookup is represented as typed entries and `Presence`.

### 4. Presence utility cleanup

Boolean presence and cardinality catalogs no longer use `Record`. Optional values are converted to `Presence<T>` at the boundary.

## Static audit

| Target | Result |
|---|---:|
| `??` in routeAst | 0 |
| `null` literal in routeAst | 0 |
| `Record` in routeAst | 0 |
| `switch` in routeAst | 0 |
| `indexOf/findIndex` in routeAst | 0 |
| positional arithmetic outside `TokenCursor` | 0 |
| `[0]/[1]` outside navigation | 0 |
| negative `slice` outside navigation | 0 |
| TypeScript transpile of routeAst | PASS (11/11) |

`while`/`if` remain in the traversal/parser execution layer where they implement scanning and structural guards. They are not used as the vocabulary of Laravel semantics. `routeSyntaxModel`, `routeDataFlow`, and `delimiterNavigation` contain no actual `if`, `switch`, or `while`; optional chaining hits are not ternary expressions.

## Data-flow invariant

`source -> syntax_fact -> semantic_fact -> consumer`

Facts retain provenance and cardinality. Group constraints remain append-only and retain `route` vs `group` source. Empty collections are not conflated with missing syntax at the navigation boundary.

## External architecture check

Tree-sitter's official documentation recommends named fields/relations for syntax analysis instead of relying on ordered child positions. Its basic parsing API separates named-node traversal from anonymous token traversal. Laravel 13 documents nested route groups as merged attributes, including middleware and `where` conditions.
