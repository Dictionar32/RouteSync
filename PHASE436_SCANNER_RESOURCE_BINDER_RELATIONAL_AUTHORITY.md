# Phase 436 — Scanner Resource Binder Relational Authority

## Scope

`packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts`

## Architecture

Resource binding semantic dispatch is now expressed as declarative relations and the semantic decision/rewrite engine rather than source-language control flow.

- collection traversal: `relationProject`, `relationExpand`, `relationSelect`
- presence/shape predicates: `relationGate`, `relationAll`, `relationEqual`
- alternative resolution: `solveCandidate`
- lazy semantic rewrites: `solveRewriteCandidate`
- optional semantic results: `RelationOption` + `relationOptionFold`

The migration preserves the existing resource AST contract and error boundaries while moving dispatch authority into the relation/solver layer.

## Forbidden-pattern audit

The target file reports zero occurrences for:

`if`, `for`, `while`, `switch`, `.map()`, `.filter()`, `.reduce()`, `.flatMap()`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `.trim()`, `&&`, positional `index + N`, and `.slice()`.

## Validation

- TypeScript `transpileModule`: 0 diagnostics.
- ZIP integrity: verified with `unzip -t`.

## Research alignment

The architecture follows the same broad separation seen in declarative compiler systems: MLIR PDLL separates match constraints from rewrites; MLIR PDL represents patterns and rewrites as IR; egglog combines equality saturation with Datalog; JastAdd uses iterative circular fixed-point attributes.
