# Phase 1605 — Interface Authority Inference Preservation Audit

## Objective

Close a generic contract gap at the authority boundary before changing scanner wiring or runtime execution. Phase 1604 bound the authority proof's verification correlation witness to `TInference`, but the authority assessment type erased that parameter back to the default inference family.

## Changes

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
  - Added `TInference` to `RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>`.
  - Propagated the same inference parameter into every discriminated assessment branch's `decision` proof.
  - Made `RequestTypeDerivationSemanticAuthorityInterface.evaluate` generic over the candidate's concrete inference packet and return the correspondingly parameterized assessment.
- `packages/core/src/types/upstream/__test__/requestTypeDerivationAuthorityInferencePreservation.phase1605.test.ts`
  - Added type-level checks that the assessment's verification binding preserves the inference and contract parameters.
- No scanner wiring, runtime executor, semantic producer, or downstream projection files were changed.

## Contract effect

The authority boundary no longer widens a candidate's `TInference` to the default `RequestTypeDerivationSemanticInferenceFor<TContract>` merely because the candidate is wrapped in an assessment. This is compile-time correlation only; it does not prove runtime object identity or value equality. The authority implementation must still validate the supplied input and preserve the candidate's proof rather than re-infer meaning.

## Verification status

- Source-level structure checks: performed during packaging.
- ZIP integrity and top-level `RouteSync/` path: checked during packaging.
- TypeScript, Vitest, and package build: not run in this environment; do not treat this phase as build-verified.
