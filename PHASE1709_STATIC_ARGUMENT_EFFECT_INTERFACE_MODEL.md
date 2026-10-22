# Phase 1709 — Static Argument and Effect Interface Model

## Scope

Interface-first only. This phase extends the static invocation domain contract beyond target resolution into typed argument-binding and effect-projection subjudgments. It does not implement semantic algebra, authority validation, runtime execution, or production scanner wiring.

## Changes

- Added `InvocationStaticPositionalArgumentEvidence`, bound to one static subject and its exact ordered argument IDs.
- Added candidate/callable-bound static argument claims and per-argument dispositions with independent argument, parameter, and correspondence provenance.
- Added closed static binding outcomes: `not-required`, `established`, `incomplete`, `blocked`, and `argument-form-unproven`.
- Added static effect-projection outcomes with separate result and exception emission channels; effects can only belong to a uniquely resolved callable.
- Added `InvocationStaticArgumentAndEffectContract` and attached it to `InvocationStaticJudgmentModelContract` and coverage.
- Bumped static judgment model to version 3 and pipeline contract to version 16; exported new public types.
- Kept Laravel controller scanner source-only and left production wiring unchanged.

## Invariants

- Static calls retain class-operation identity; no receiver is invented.
- Argument binding requires unique target resolution and explicit upstream positional-normalization evidence.
- Every argument has one ordered disposition; correspondence claims preserve separate non-empty source provenance.
- Unresolved or ambiguous target blocks binding and effect projection.
- Result and exception emissions remain separate.
- These are subjudgment contracts, not a claim of full static invocation proof/closure support.

## Verification

Run `npm run audit:phase1709-static-argument-effect-interface-model`.
Build and complete TypeScript typecheck are not asserted by this phase. Production wiring, semantic algebra, and authority are intentionally unchanged.
