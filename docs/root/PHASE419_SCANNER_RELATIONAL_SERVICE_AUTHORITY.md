# Phase 419 — Scanner Relational Service Authority

## Scope

This phase continues the scanner/resolver authority migration from Phase 418. The target is
`packages/core/src/compiler/scanner/subscanners/serviceAstCanonical.ts`.

## Architectural change

The service scanner now uses the semantic relation layer for several decisions that previously
lived directly in TypeScript control flow:

- parameter type interpretation is expressed as candidate requirements solved by `solveCandidate`;
- nullability projection uses `relationGate`;
- parameter-model collection uses `relationFold`;
- assignment-target dispatch uses candidate relations;
- PHP `for`-clause dispatch uses candidate relations;
- class-name discovery uses `relationIndexOf` and `relationAdvanceIndex`;
- service method result propagation uses `relationFixedPoint`, making the existing iterative semantic
  convergence an explicit fixed-point relation;
- filesystem/service scanning uses `relationAsyncFold` instead of host-language `for` loops.

This follows the same architectural direction as declarative matcher/rewrite IRs: MLIR PDL/PDLL
separates matching from rewriting, while JastAdd makes circular semantic computation a declarative
fixed-point equation; egglog combines equality saturation with Datalog-style relations.

## Validation

`serviceAstCanonical.ts` transpiles with TypeScript with **0 transpile diagnostics**.

The full scanner is **not** claimed clean in this phase. Remaining hotspots are deliberately left
for subsequent relation migrations, notably `collectTypedParameterModels`, `bodyExpressions`,
`returnFlow`, dependency projections, and the lexer `astClassifierEvidence.ts`.
