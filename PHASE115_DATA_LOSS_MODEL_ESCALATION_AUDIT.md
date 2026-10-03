# Phase 115 — Data Loss / Model Escalation Audit

## Scope

Audit Route AST syntax extraction for data loss and accidental encoding of syntax knowledge in control flow or positional arithmetic.

## Results

- `??` in `routeAst`: 0
- `indexOf` / `findIndex`: 0
- numeric token indexing `[0]` / `[1]`: 0
- numeric positional arithmetic outside `TokenCursor`: 0
- explicit `if` / `switch` / `while` in `routeSyntaxModel.ts`: 0
- semantic ternaries in `routeSyntaxModel.ts`: 0
- route AST TypeScript transpilation: PASS (10/10 files)

## Model escalation

1. Route method recognition is catalog-driven.
2. Route target method expansion is strategy-driven.
3. Resource middleware argument ownership is strategy-driven.
4. Constraint interpretation is strategy-driven.
5. Route group attributes and binding scope are catalog-driven.
6. Group push/pop/retain is represented as a transition model.
7. Group constraints accumulate append-only; absence no longer overwrites prior facts.
8. Singular group properties use named first-value selection rather than positional indexing.
9. Route target fallback is represented as an ordered candidate model rather than a ternary chain.
10. Stack pop is encapsulated as a stack operation (`pop`) rather than index arithmetic.

## Traversal boundary

`TokenCursor` remains the primitive syntax-navigation boundary for `position + 1`, `position + 2`, and cursor advancement. Delimiter stack mutation is encapsulated by `delimiterNavigation.ts`. Parser/model code does not perform token-position arithmetic.

## Architectural basis

Tree-sitter recommends named fields for accessing syntax children by semantic name instead of ordered position, and its navigation API exposes named children/siblings and fields. Laravel 13 documents route-group inheritance/merging and resource middleware scopes as structured route syntax. This checkpoint follows those principles by making syntax relations and Laravel vocabulary explicit model data.
