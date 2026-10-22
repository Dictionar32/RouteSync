# Phase 1669 — Invocation Interface Outcome Closure

## Scope

This phase refines only `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`, adds an audit script, and adds this report. Algebra, authority, runtime executor, scanner, and downstream consumers are intentionally untouched: the user explicitly requires interface-first work.

## Contract refinements

- Advanced `InvocationSemanticModel` to version 12 and `InvocationSemanticContract` to version 23.
- Added explicit per-argument dispositions for target-unavailable and argument-form-unproven outcomes. Previously, those outcomes could carry an empty ledger while the invocation itself had arguments, violating the declared coverage invariant.
- Made the `blocked` outcome retain each argument as `binding-unavailable-argument`, including whether the target was unresolved or ambiguous.
- Made `argument-form-unproven` retain each argument in the same ordered ledger instead of withholding all per-argument representation.
- Preserved the established-only-bound and incomplete-has-unbound distinction as an explicit semantic invariant. TypeScript can enforce non-empty ledgers and the bound-only shape for `established`; the authority must still validate identity, exact order/coverage, and that `incomplete` contains at least one unbound disposition.
- Tightened ambiguous-target obligation candidate cardinality to at least two callable candidates.
- Updated coverage/provenance invariants to apply to every outcome and every disposition, not only successful bindings.

## Verification

- Strict interface-focused TypeScript check passed.
- Phase 1669 audit: 14/14 checks passed.
- ZIP integrity check passed.
- Full repository build/tests were not run. This is still an interface-only staged change and existing producers/consumers have not yet been migrated.

## Migration gate

Before wiring changes, inspect whether upstream can supply per-argument evidence for blocked and unproven outcomes. Do not fabricate source evidence. Next interface-first review should confirm no outcome loses argument identity and that target-unavailable dispositions are correctly represented in the domain meaning. Only after the contract is accepted should algebra and authority be migrated.
