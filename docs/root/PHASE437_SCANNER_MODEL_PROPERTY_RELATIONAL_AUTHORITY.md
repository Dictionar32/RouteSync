# Phase 437 — Scanner Model Property Relational Authority

Baseline: Phase 436.

## Scope

Migrated `packages/core/src/compiler/scanner/subscanners/model/modelPropertyAstParser.ts` from imperative token traversal to relational semantic evaluation.

## Architecture

- token traversal: `relationFold`
- bounded modifier lookup: relational slice + last-index relations
- visibility/type selection: `relationGate` and relational predicates
- value-end discovery: relational fold state
- property emission: relational candidate/state projection
- text extraction: `relationTextSlice`
- positional movement: `relationAdvanceIndex`

No source-language control-flow construct is used as semantic authority in the migrated file.

## Verification

Target lexical audit: 0 occurrences of:
`if`, `for`, `while`, `switch`, `.map(`, `.filter(`, `.reduce(`, `.flatMap(`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `.trim(`, `&&`, `index + N`, `.slice(`.

TypeScript `transpileModule`: 0 diagnostics.

Full project typecheck remains environment-dependent and is not used as the target-file correctness claim.
