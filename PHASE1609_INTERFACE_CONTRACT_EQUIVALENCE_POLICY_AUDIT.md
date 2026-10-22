# Phase 1609 — Interface Contract Equivalence Policy Audit

## Goal

Close the Phase 1608 ambiguity: the integrity interface required contract compatibility checks but did not name the capability that defines runtime contract-value equivalence.

## Interface-first changes

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
  - Added `RequestTypeDerivationContractEquivalenceInterface<TContract>` with an explicit `equivalent(left, right)` operation.
  - Bound `RequestTypeDerivationSemanticAuthorityIntegrityInterface<TContract, TInference>` to exactly one `contractEquivalence` policy.
  - Documented the required equivalence laws: deterministic, reflexive, symmetric, and transitive. Reference equality is permitted only when the contract is intentionally identity-scoped.
  - Kept validation limited to existing witnesses; no inference, reclassification, proof repair, scanner wiring, or runtime executor implementation was added.
- `packages/core/src/types/upstream/__test__/requestTypeDerivationAuthorityIntegrityInterface.phase1608.test.ts`
  - Added type assertions that the integrity boundary requires the explicit equivalence capability and that its operation accepts two contract values.

## Scope boundaries

Only the upstream interface, its focused contract test, and this audit document differ from Phase 1608. No implementation claims are made: this phase defines which equivalence capability a future validator must consume, but does not prove that any implementation obeys the laws or compares all witnesses correctly.

## Verification

- Source-level structural assertions: to be checked before packaging.
- TypeScript, Vitest, and package build: not run unless explicitly reported otherwise.
- ZIP must contain a top-level `RouteSync/` directory and pass `unzip -t`.
