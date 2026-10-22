# Phase 1862 — Resource Authority Composition, Interface First

## Trace finding

`LaravelResourceScanInput` previously accepted `bindingAuthority` on every scan call. The semantic authority was therefore represented as request data even though the scanner is a single canonical production component. This let a caller select or replace model-binding semantics per invocation, while the scanner interface itself did not declare which authority it executes.

The resource scan judgment already preserves the exact `LaravelControllerScanJudgment`. That object carries each controller's `LaravelControllerInvocationSemanticJudgmentInterface`, including its integrated invocation response. The resource authority consumes that whole judgment; the resource scanner returns the same object by identity rather than rebuilding a detached invocation projection.

## Interface-first change

- Advanced `LaravelResourceScannerInterface` and `LaravelResourceScanJudgment` from contract version 12 to 13.
- Bound `ResourceModelBindingJudgmentAuthority` on the scanner interface as a composition dependency.
- Removed `bindingAuthority` from `LaravelResourceScanInput`; scan input now contains source/model evidence only.
- Composed the scanner's executor with the canonical `resourceModelBindingAuthority` once. `scan()` delegates batch judgment to that bound authority.
- Updated the integrated-response contract to state that semantic authority ownership is fixed at scanner composition, while the complete controller scan and its invocation response remain correlated in the returned judgment.

## Deliberate limits

- This does not claim that `resourceModelBindingAuthority.ts` has been converted from imperative candidate/outcome construction into a pure semantic-relation executor. That remains the next semantic-model migration.
- It does not remove the resolved/rejected AST projection branch, nor does it remove internal batch ordering/index correlation.
- `resourceProducer` remains because the production path still uses it.
- `StaticLaravelScanner.ts` remains empty; it is not restored.

## Validation

The phase audit verifies the interface-owned dependency, absence of per-scan authority injection, authority delegation, and preservation of the exact controller scan in the integrated response. No full build or TypeScript typecheck is claimed.
