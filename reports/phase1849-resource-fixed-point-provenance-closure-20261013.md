# Phase 1849 — Resource Fixed-Point Provenance Closure

## Scope

This phase continues from Phase 1848 and improves the existing upstream contract and authority. It does not add a parallel authority or move semantic reasoning into scanner runtime.

## Trace finding

The prior fixed-point equality compared resolved model names, unresolved reasons, and ambiguous model names, but ignored source spans and candidate evidence. Therefore a batch could be declared stable even if the semantic evidence supporting a candidate changed between iterations. Propagated evidence could also be repeated as a child judgment became known.

## Interface-first change

- Bumped `LaravelScannerSemanticJudgmentContract.version` to 8.
- Bumped `LaravelResourceScannerInterface` and its result contract to version 8.
- Added the `fixedPointEquality` contract invariant, explicitly requiring typed structural comparison of outcome, subject, candidate, and source provenance.

## Authority change

`resourceModelBindingAuthority.ts` now compares source file and span offsets, subject identity, candidate model identity, evidence basis, and each evidence source span. Resolved, unresolved, and ambiguous outcomes compare their complete source-correlated semantic evidence. Candidate evidence is deduplicated by this typed equality before candidate construction, preventing repeated propagation evidence from growing the evidence set each iteration.

The authority still performs batch closure before the scanner projects a resolved judgment into a resource AST. The scanner continues to receive the complete `LaravelControllerScanJudgment`, preserving the integrated invocation response context.

## Static audit

Run with:

`node scripts/audits/audit-phase1849-resource-fixed-point-provenance-closure.cjs`

Build, typecheck, and E2E were not run.
