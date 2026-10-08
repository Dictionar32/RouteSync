# Phase 438 — Scanner Controller Relational Authority

Migrated `packages/core/src/compiler/scanner/subscanners/controller/actionVariableTracker.ts` from imperative scanner authority to declarative semantic relations.

## Authority changes
- `Map`-backed parameter/environment indexes -> immutable relation catalogs + `relationLookup`.
- parameter traversal -> relational recursive state transition using `relationGate` and `relationAdvanceIndex`.
- assignment classification -> `solveRewriteCandidate` requirements/rewrite candidates.
- local model/table/alias dispatch -> candidate/rewrite solver.
- controller binding lookup -> `RelationOption` + relational fold.
- absence -> `RelationOption`, not language-level absence sentinel.
- positional movement -> `relationAdvanceIndex`.
- infrastructure-name predicates -> relational projection/quantification.

## Audit
Target file has zero occurrences of the Phase 438 forbidden implementation vocabulary:
`if`, `for`, `while`, `switch`, `.map()`, `.filter()`, `.reduce()`, `.flatMap()`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `.trim()`, `&&`, positional `index + N`, `.slice()`, and ternary operator syntax.

TypeScript `transpileModule`: 0 diagnostics.

Full project `tsc --noEmit -p tsconfig.json` remains environment-blocked by missing `@types/node` and `vitest/globals`.
