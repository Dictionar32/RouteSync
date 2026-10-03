# Phase 422 — Scanner/Resolver Relational Authority

## Objective
Continue moving scanner/lexer and resolver authority away from imperative traversal and collection APIs toward declarative semantic relations, relation folds, lookup witnesses, and solver/rewrite boundaries.

## Changes
- `sourceAstScanner.ts`
  - source-file property traversal uses `relationAsyncFold` / `relationExpand`;
  - source method traversal uses relational expansion and async folds;
  - class-owner discovery uses relation index/option lookup;
  - contextual attribute discovery uses `relationSelect` + `relationProject` instead of imperative loop/filter.
- Existing lexer authority from Phase 421 remains relational: token catalog lookup uses relation lookup/fold and positional movement uses relation index/advance primitives.
- Existing resolver authority remains relation-backed; route binding resolution is recursive relation closure rather than imperative iteration.

## Research basis
MLIR PDLL explicitly separates match and rewrite sections and represents declarative pattern rewrites; MLIR PDL represents matcher/rewrite infrastructure as IR. Soufflé models computation around typed relations and rules. egglog combines equality saturation with Datalog. JastAdd demonstrates declarative circular fixed-point evaluation.

## Verification
- TypeScript `transpileModule` diagnostics: 0 for modified scanner orchestrator and lexer authority file.
- Full project `tsc` remains environment-blocked by missing `node` and `vitest/globals` type definitions; no claim of full typecheck is made.

## Boundary rule
Language tokens such as `===`, `||`, `&&`, and `??` are retained when they are PHP vocabulary data. The migration targets their use as implementation-level control/selection operators in semantic authority code.
