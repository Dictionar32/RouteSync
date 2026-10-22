# Phase 1671 — Invocation Outcome Correlation

## Scope

Interface-first refinement only. This phase updates `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`, adds a focused static contract audit, and records the boundary. No algebra, authority, runtime executor, scanner, or downstream wiring was changed.

## Contract changes

- Advanced `InvocationSemanticModel` from version 13 to 14 and `InvocationSemanticContract` from version 24 to 25.
- Narrowed an `incomplete` argument ledger to proven `bound-argument` claims and `unbound-argument` dispositions. It can no longer structurally contain a target-unavailable or argument-form-unproven disposition.
- Split the `blocked` outcome into correlated variants: an unresolved target can carry only unresolved-target argument dispositions; an ambiguous target can carry only ambiguous-target argument dispositions. This closes a mismatch that the prior nested discriminated union alone did not prevent.
- Made the semantic invariant state both restrictions explicitly.

## Verification

- The Phase 1671 static contract audit is expected to pass 13 checks.
- A focused strict TypeScript check of the interface module passed.
- A separate strict TypeScript type-assertion fixture passed, checking that unresolved and ambiguous blocked outcomes are incompatible and that argument-form-unproven dispositions cannot enter the incomplete ledger.
- ZIP root and archive integrity are checked after packaging.
- Full repository build/tests are not claimed.

## Remaining authority responsibilities

The interface still cannot prove that every argument disposition's `argument` identity matches the exact ordered `invocation.arguments` sequence, that a disposition's obligation invocation equals the enclosing invocation, or that evidence is authentic. These are value-level correlation/provenance checks for the later authority migration. This phase deliberately does not change runtime wiring.
