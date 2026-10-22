# Phase 1612 — Authority Integrity Wiring Audit

## Objective

Place the Phase 1611 witness validator directly in front of semantic authority evaluation. The gate accepts the original invocation input, the candidate, and the original verifier envelope as separate arguments. It returns `integrity_rejected` without calling authority when witness validation fails; only `integrity_valid` can proceed to `authority.evaluate`.

## Changes

- Added `requestTypeDerivationAuthorityIntegrityGate.ts` as a typed, executable gate.
- Exported the gate from the upstream public type surface.
- Added a type-contract test for the three required inputs and closed result union.

## Boundary properties

- The gate does not infer or classify source semantics.
- The gate does not synthesize an authority assessment on integrity failure.
- The verifier envelope is passed by the caller rather than reconstructed from candidate premises; reconstructing it would make key correlation checks tautological.
- Authority evaluation is called only after the integrity result is `integrity_valid`.

## Important limitation

This closes the new `RequestTypeDerivationSemanticAuthorityInterface` invocation seam, but does **not** claim that the existing legacy `RequestTypeDerivationSemanticPipelineInterface` / `requestTypeDerivationRuntimeExecutor.ts` production path has been migrated to this gate. That runtime path currently consumes the older closed assessment ADT and performs its own shape, input, contract-law, and decision-rule checks. Migrating that legacy path requires a separate contract-level change so integrity rejection is representable without fabricating an authority assessment. End-to-end migration readiness is therefore still unproven.

## Verification

- Static source assertions and ZIP integrity checks are run for this phase.
- TypeScript/Vitest/build results must be recorded separately; no claim of a successful build is made unless the relevant commands complete successfully.
