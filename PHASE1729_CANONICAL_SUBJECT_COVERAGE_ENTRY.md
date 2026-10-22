# Phase 1729 — Canonical Subject Coverage Entry

## Trace finding

Phase 1728 kept `subject`, `identity`, and `source` as separate fields on inventory entries, and repeated `identity`/`source` on publication entries. Those fields can disagree even though they describe the same source fact. Earlier contracts tried to handle this duplicated state with mismatch violations, pushing a model weakness into runtime validation.

## Interface-first correction

`InvocationSemanticSubjectCoverageEntry` is now a discriminated union for ordinary and static subjects. The source subject is the single owner of invocation form, knowledge identity, and source evidence. Inventory and publication entries no longer copy identity/source into sibling fields. The correspondence receipt retains a derived identity alongside the paired entries, where it acts as an auditable claim that the authority must verify.

Contract versions: coverage v22, pipeline v38, Laravel scanner boundary v17.

## Boundary

This is a type-contract correction only. It does not claim that inventory authority, publication authority, static algebra, or Laravel production wiring has been implemented. No full package build was run.
