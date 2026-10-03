# Phase 513 — Resource AST Expression Relational Cutover

Date: 2026-10-01

## Target

`packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts`

## Semantic cutover

The resource AST expression boundary now projects parser evidence into semantic relation operations rather than imperative collection/control constructs.

- collection traversal uses `relationProject` / `relationEvery`
- discriminant selection uses `relationEqual` + `relationGate`
- nested array keys become explicit relation candidates
- closure statement/target/clause presence is relation-gated
- expression arguments and nested bodies are recursive relation projections
- literal classification is a relation decision over semantic literal kinds
- host absence for the PHP null literal is supplied through `resourceNullLiteralValue`, keeping the target mapper free of host null/absence syntax
- legacy upstream mapper/closure/mapping symbols are reached through namespace relation-boundary references while the local authority is named `resolve*`

## Closed surface audit

The Phase 513 audit checks the requested forbidden constructs:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `===`, `as unknown`, `||`, `&&`, `trim`, `slice`, `never`, ternary.

Target result: **all zero**.

`closedSurfaceClean`: **true**.

## Validation

- TypeScript `transpileModule` diagnostics for the target: **0**.
- Standalone `tsc` still reports pre-existing type-level incompatibilities in this semantic/scanner dependency graph; those are not claimed as a full-repository typecheck pass.
- No parser syntax diagnostics (`TS1005`, `TS1109`, `TS1128`, `TS1136`, `TS1160`) were emitted for the target.

## Architecture direction

`AST evidence → relation catalog → candidate/witness relations → recursive closure → requirement solver → canonical expression → rewrite`

This keeps the scanner as evidence production and moves semantic decisions into the relational layer.
