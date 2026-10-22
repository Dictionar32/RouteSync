# Phase 2589 — Coverage Contract Identity Closure

## Root cause

The `contract_incomplete` coverage variant used `contract: null`, even though the coverage operation was invoked with a concrete contract and the authority integrity validator already validates contract identity. That erased the contract identity exactly on the failure path and forced the validator to skip equivalence checking for that variant. The coverage operation also represented an unreachable empty-ledger case with a thrown exception instead of narrowing the existing non-empty ledger type.

## Changes

- `RequestTypeAuthorityCoverageEvidence.contract_incomplete.contract` now retains `RequestTypeDerivationContract`.
- `RequestTypeAuthorityCoverageEvidenceFor<TContract>` retains the exact `TContract` for `contract_incomplete` as well as the other variants.
- Coverage generation narrows non-empty law lists through a type predicate and does not throw or manufacture a null contract witness.
- Authority integrity now checks coverage contract equivalence unconditionally.
- The authority's existing closed outcome for incomplete law coverage is preserved.

## Boundary

This does not implement semantic reasoning or a complete proof verifier. The production CLI still requires a supplied reasoning/verifier/decision/authority/integrity composition and fails closed when it is absent. This phase closes a contract-identity hole; it does not claim end-to-end RequestType derivation is operational.

## Verification

Run `node scripts/audits/audit-phase2589-coverage-contract-identity-closure.cjs` from the repository root. The audit checks the ADT, operation, integrity wiring, and TypeScript syntax transpilation. Full typecheck, Vitest, package build, and CLI E2E are not implied by this audit.
