# Phase 104 — Data-Loss Audit: Traversal Arithmetic Encapsulation

## Scope

Audit lanjutan memeriksa boundary `phase93/packages/core/src/compiler/scanner/lexer/routeAst` untuk memastikan positional arithmetic (`i + N`, `index + N`, `tokens[index ± N]`) tidak menjadi tempat penyimpanan pengetahuan syntax.

## Result

- Raw token arithmetic outside `TokenCursor`: **0**.
- Raw token indexing with arithmetic outside `TokenCursor`: **0**.
- Repeated `.advance().advance()` traversal chains outside `TokenCursor`: **0**.
- Call traversal facts are now named model relations: `callArgumentCursor`, `secondCallArgumentCursor`, `callCloseCursor`, `afterCallCursor`.
- `SyntaxNavigation` exposes those relations explicitly.

## Data-loss invariant

Free data is never replaced merely because traversal cannot classify it.

- unknown stays unknown;
- missing arguments stay absent;
- literal payloads stay intact;
- argument identity is represented by syntax relation, not ordinal arithmetic;
- nested delimiters do not cause an inner comma to be mistaken for the next top-level argument.

## Important fix

`secondCallArgumentCursor` now tracks nested `()`, `[]`, and `{}` while searching for the top-level comma. This prevents data loss for arguments containing arrays, closures, nested calls, or other delimited syntax.

## Laravel alignment

Laravel's routing surface treats controller actions, route parameters, constraints, groups, bindings, and resource configuration as distinct syntax/semantic concepts. The parser therefore records syntax relations first and lets downstream semantic models interpret the Laravel meaning. This is consistent with Laravel's current routing documentation and framework routing implementation.

## Control-flow rule

`if`/`while` are still allowed where they implement recognition/iteration mechanics. They are not allowed to become the storage location for syntax knowledge that should be represented by a model relation or AST fact.

The goal is not mechanical removal of control flow. The goal is to make the model carry the knowledge and leave flow as a dumb executor of that model.

## Validation

TypeScript transpile/syntax validation of all four modified route-AST files passed. Full repository typecheck/test remains environment-limited because the workspace does not contain the complete installed type-definition/dependency set (for example `chai`, `node`, `react`, and related definitions).
