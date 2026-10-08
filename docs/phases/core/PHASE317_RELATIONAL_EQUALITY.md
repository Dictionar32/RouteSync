# Phase 317 — Relational Equality and Semantic Surface Audit

Phase 317 extends the relational substrate beyond control-flow elimination.

## New semantic primitive

`semanticRelations.ts` introduces:

- `relationEqual`
- `relationNotEqual`
- `relationSome`
- `relationNone`
- `relationIsSome`
- `relationIsNone`

Equality is now an explicit semantic relation rather than a language-level
strict-equality operator. `relationEqual` preserves JavaScript strict-equality
behavior for ordinary values while explicitly handling the two cases where
`Object.is` differs from strict equality: `NaN` and signed zero.

## Migrated surfaces

- `UnionFind` now expresses representative equality through `relationEqual`.
- `syntaxErrorRelationCore` now expresses diagnostic-relation matching through
  `relationEqual`.

## Audit expansion

`audit-declarative-surfaces.cjs` now performs TypeScript-AST checks for:

- `if`, `for`, `while`, `switch`
- `map`, `filter`, `reduce`, `flatMap`
- `??`
- `undefined`
- `null` literals
- `===` / `!==`
- TypeScript `as` assertions

The audit intentionally distinguishes source-language evidence strings such as
PHP `"??"` from compiler implementation operators. A PHP token is data; an
implementation construct is executable semantic machinery.

## Next migration

The remaining `null`, strict equality and `as` occurrences in parser and query
surfaces must be converted to `RelationOption`, relation equality and typed
constraint/narrowing relations. They are not to be replaced mechanically with
another sentinel or a cosmetically renamed branch.
