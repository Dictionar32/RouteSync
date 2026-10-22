# Phase 1472 — Callable Parameter and Argument Contract

## Pipeline

Source token evidence → typed callable-list knowledge → callable-list algebra → closed parameter/argument judgment → upstream interface → runtime wiring → AST projection.

## Changes

- `ScannerCallableListInterface` now exposes `resolveParameters` and `resolveArgument` with typed evidence and closed judgments.
- The algebra owns parameter list partition validation, parameter-variable cardinality, by-reference and variadic flags, default-value boundaries, and positional/named/unpacked argument classification.
- `parseParameters` projects upstream parameter evidence into `PhpParameter`, including default value, reference passing, and variadic status.
- `parseArgument` projects the algebra's closed argument variant into `PhpArgument`.
- AST-specific expression parsing remains in runtime by design; it receives already-classified token slices rather than deciding the callable-list grammar again.

## Verification boundaries

The focused upstream interface/algebra strict TypeScript check is the local verification target. The complete scanner compilation still reports existing errors in loop-statement wiring and semantic evidence/query producer modules. Full package build and Vitest require the repository's missing dependencies and are not claimed as passing.
