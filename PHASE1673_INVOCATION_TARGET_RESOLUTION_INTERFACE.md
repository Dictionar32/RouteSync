# Phase 1673 — Invocation Target Resolution Interface

## Scope

Interface-first phase. This phase changes the invocation semantic contract and adds focused audit/type-level checks. It does not migrate the algebra, authority implementation, runtime executor, scanner, or downstream consumers.

## Contract changes

- `InvocationSemanticModel` version: 15 → 16.
- `InvocationSemanticContract` version: 26 → 27.
- Added `InvocationTargetResolutionJudgment`, a discriminated domain union:
  - `resolved`: exactly one named `target`.
  - `unresolved`: an empty candidate tuple and an unresolved-target obligation.
  - `ambiguous`: at least two callable candidates and an ambiguous-target obligation.
- Invocation judgments now expose `targetResolution` instead of an unconstrained `callTargets` array. Consumers can discriminate on the semantic outcome rather than infer meaning from candidate-array cardinality.
- The meaning model and proof-binding contract explicitly include target-resolution outcome.

## Verification

- `audit-phase1673-invocation-target-resolution-interface.cjs`: 10/10 checks passed.
- Focused strict TypeScript check passed for the interface and `phase1673-invocation-target-resolution-typecheck.ts`.
- Type-level negative cases verify that unresolved outcomes cannot contain candidates and ambiguous outcomes require at least two.
- Full repository build was not run. The judgment field change is an intentional interface-first migration boundary; algebra, authority, executor, scanner, and downstream call sites have not yet been migrated in this phase.

## Known boundary

TypeScript can constrain candidate cardinality and outcome shape, but it cannot prove that the obligation and evidence refer to the same runtime invocation object or that evidence genuinely supports the claim. The authority must validate those correlations in the subsequent migration phase.
