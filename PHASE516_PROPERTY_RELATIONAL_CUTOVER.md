# Phase 516 — Property Producer Relational Cutover

Target: `packages/core/src/compiler/scanner/subscanners/model/propertyProducer.ts`

The property scanner boundary now treats semantic classification as relation data and candidate witnesses rather than host-language branching.

## Cutover

- top-level type splitting uses recursive relation traversal and relation text projection
- union/intersection/array/nullable classification uses relation gates
- primitive type recognition uses a candidate relation plus first witness and option fold
- absence/bottom vocabulary is represented without lexical authority tokens
- property storage, initialization, promotion and declaration are relation-gated
- sequence construction is recursive relation closure
- documentation/presence choices are relation projections

## Forbidden surface audit

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `.trim()`, `.slice()`, `never`, and ternary: **0 occurrences** in the target.

## Verification

- Phase 516 lexical audit: `closedSurfaceClean: true`
- TypeScript `transpileModule` diagnostics for target: `0`
- Full repository typecheck is not claimed; existing repository dependency/type-shape constraints remain outside this phase.

## Architecture

`scanner evidence -> relation facts -> candidate witness -> relation closure -> canonical PropertyAst`

This keeps scanner extraction as evidence while the semantic relation layer owns classification and resolution.
