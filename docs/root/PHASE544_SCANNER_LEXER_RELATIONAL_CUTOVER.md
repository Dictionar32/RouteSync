# Phase 544 — Scanner/Lexer Relational Cutover

## Frontier closed

This phase removes imperative control/absence leakage from two scanner utilities that were still acting as local semantic authorities:

- `packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts`
- `packages/core/src/compiler/scanner/subscanners/scannerUtils.ts`

## Architectural changes

- AST evidence classification now represents conditional selection through relation gates rather than a conditional expression.
- Optional parser evidence uses relation witnesses/options rather than `null` checks.
- Member-path roots are resolved through relation lookup/folding instead of array-position absence checks.
- PHP filesystem traversal is recursive relation folding with `relationAsyncFold`.
- Cached source lookup uses the relation catalog (`relationLookup` + `relationOptionFold`) instead of an `undefined` sentinel.
- Directory/file eligibility is a relation predicate, not an imperative branch.

## Validation

`audit-phase544-scanner-lexer-relational-frontier.cjs` requires zero AST-level occurrences of the forbidden constructs and zero TypeScript transpile diagnostics for both targets.

Phase 543 regression remains green.

Repository-wide `tsc` remains environment-blocked by the existing missing `node` and `vitest/globals` type definitions; this phase introduces no target-local transpile diagnostics.
