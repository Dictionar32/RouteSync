# Phase 1714 — Static Invocation Judgment Compatibility Interface Contract

## Scope

This phase strengthens the upstream semantic model before wiring. It adds a typed compatibility matrix that declares the admissible aggregate combinations for static target resolution, argument binding, effect projection, aggregate status, and obligation ownership. It is a contract, not a claim that the static invocation algebra or authority is implemented.

## Trace and design correction

Phase 1713 assigned each obligation kind to a rule. The remaining interface gap was that the aggregate `incomplete` judgment could still pair target, binding, and effect subjudgments in semantically contradictory ways. This phase makes the compatibility relation explicit and non-overlapping: each relation has an exact target state, binding state, effect state, aggregate state, and obligation owner. The tuple in the contract fixes the canonical ten supported combinations. Combinations not represented by the matrix are authority violations and must be rejected, not repaired or reclassified by the scanner.

## Contract changes

- Added `InvocationStaticJudgmentCompatibilityRelation` as a closed discriminated union with ten exact combinations.
- Added `InvocationStaticJudgmentCompatibilityContract` and `INVOCATION_STATIC_JUDGMENT_COMPATIBILITY_CONTRACT`.
- Attached compatibility to aggregate judgment, static judgment model, source coverage, and pipeline contracts.
- Advanced aggregate judgment contract to v5, static model and coverage to v9, and pipeline to v22.
- Exported the compatibility value and relation types from the public core entry point.
- Updated prior regression audits to track the current contract versions.
- Did not modify production scanner wiring, static invocation algebra, or authority validator implementation.

## Verification

- Interface audit suite: 204/204 checks passed.
- Targeted strict TypeScript check of `invocationSemanticPipelineInterface.ts`: PASS.
- Full package build: NOT RUN.

The current source coverage remains honest: ordinary invocation is the implemented judgment domain; static invocation remains a distinct source fact awaiting algebra and authority implementation.
