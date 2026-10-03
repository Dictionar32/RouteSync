# Phase 440 — Scanner Resource Invocation Relational Authority

## Scope

Migrates `packages/core/src/compiler/scanner/subscanners/controller/resourceInvocationDetector.ts` from imperative token scanning to declarative semantic relations.

## Authority model

- token traversal: relational folds
- whitespace/argument boundaries: guarded relations
- invocation alternatives: `solveRewriteCandidate`
- optional argument presence: `RelationOption`
- semantic predicates: `relationEqual`, `relationAny`, `relationAll`
- positional traversal: `relationAdvanceIndex`
- semantic assembly: relational option folding

## Audit

The target has zero occurrences of: `if`, `for`, `while`, `switch`, `.map()`, `.filter()`, `.reduce()`, `.flatMap()`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `.trim()`, `&&`, positional `index + N`, and `.slice()`.

TypeScript `transpileModule` reports zero diagnostics for the target.

## Research basis

MLIR PDLL separates match/constraints from rewrite; MLIR DRR represents source patterns, result patterns and constraints declaratively; JastAdd models circular computations through fixed-point evaluation; egglog combines equality saturation with Datalog.
