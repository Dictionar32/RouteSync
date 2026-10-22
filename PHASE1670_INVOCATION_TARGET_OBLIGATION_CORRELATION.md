# Phase 1670 — Invocation Target/Obligation Correlation

## Scope

Interface-first refinement only. Changed `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`, added a focused static contract audit and this report. No semantic algebra, authority, runtime executor, scanner, or downstream wiring was migrated.

## Contract refinement

- Advanced `InvocationSemanticModel` to version 13 and `InvocationSemanticContract` to version 24.
- Replaced the target-unavailable argument's independent `targetStatus` field with a discriminated union: `unresolved` requires a `callable_target_unresolved` obligation, while `ambiguous` requires a `callable_target_ambiguous` obligation.
- This prevents a structurally valid interface value from declaring one target status while carrying the other kind of obligation.
- Kept per-argument identity and evidence in the blocked ledger, and made the correlation rule explicit in the semantic contract.

## Verification

- Focused static audit: 12 checks expected.
- Strict TypeScript check of the interface module is required for this phase.
- ZIP structure/integrity is checked after packaging.
- Full repository build/tests are not claimed; this phase intentionally does not migrate existing producers/consumers.

## Boundary

This closes one interface-level contradiction only. The authority must still validate that each disposition's obligation refers to the enclosing invocation, that ordered dispositions cover `invocation.arguments` exactly once, and that evidence is authentic upstream evidence. Those checks belong to the later wiring/authority migration, not this interface-only phase.
