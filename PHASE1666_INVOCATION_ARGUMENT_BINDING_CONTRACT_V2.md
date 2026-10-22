# Phase 1666 — Invocation Argument-Binding Contract v2

## Decision

The interface is strengthened before any algebra/authority/executor/scanner migration. This phase intentionally does **not** claim that the repository is fully migrated or build-clean; consumers still produce the Phase 1663/1664 shape and require a separate wiring phase.

## Contract changes

1. **Argument-form prerequisite is explicit.** A `readonly KnowledgeId[]` only preserves order; it does not prove positional semantics. Binding now requires `InvocationPositionalArgumentEvidence`. If upstream cannot establish this evidence, the contract has the `argument-form-unproven` outcome and a first-class `argument_form_unproven` obligation rather than guessing.
2. **Outcomes are structurally tighter.** `not-required` narrows arguments and bindings to empty tuples. `established` requires at least one argument and one binding claim with no unbound arguments. `incomplete` requires at least one typed unbound argument with its own obligation and evidence.
3. **Target cardinality is correlated.** `unresolved` carries an empty candidate tuple; `ambiguous` carries at least two callable candidates. Authority validation must still ensure candidate identities are distinct.
4. **Provenance belongs to claims.** Each binding claim has argument, parameter, and correspondence evidence rather than relying only on a broad judgment-level source list.
5. **Cross-field invariants are declared for authority validation.** Binding identity must match the enclosing invocation/target; bound and unbound arguments must partition the invocation arguments; every claim/obligation must retain claim-specific provenance. TypeScript cannot prove those cross-field equalities, so the interface explicitly assigns them to authority-boundary validation, not executor/scanner reasoning.
6. Contract version advances to 21 and semantic model version to 10.

## Scope

Changed only:
- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
- `scripts/audits/audit-phase1666-invocation-argument-binding-contract-v2.cjs`
- this report

Not changed: semantic knowledge producer, algebra, authority, runtime executor, scanner, and downstream consumers. Those will be migrated only after this contract is accepted.

## Verification

- Focused strict TypeScript check of the interface: run for this phase.
- Phase 1666 structural audit: run for this phase.
- Full repository build attempted with `npm run build`, but could not start because `tsdown` is not installed in this workspace (`sh: 1: tsdown: not found`). This is an environment/dependency limitation, not a successful build claim. The downstream migration is intentionally pending.
