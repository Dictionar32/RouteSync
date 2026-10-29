# Phase 2756 — Manifest Validation and Serialization ADT Runtime

## Runtime trace

`scan command -> manifestContractValidationOperations.validate -> ManifestContractValidationJudgment -> reject branch or ManifestGenerator.save -> manifestSerializationOperations.serialize -> JSON output`.

## Runtime changes

- `ManifestContractValidator.ts` now returns a closed ADT: `manifest_contract_validated` or `manifest_contract_rejected` with a typed violation list. Validation failure is no longer communicated solely by throwing through the command path.
- `scan.ts` exhaustively handles the validation judgment and does not persist a manifest after rejection.
- `ManifestSerializer.ts` exposes serialization through `manifestSerializationOperations: ManifestSerializationOperationsInterface`.
- `ManifestGenerator.ts` consumes the typed serialization operation.

## Audit

Run `npm run audit:phase2756-manifest-validation-serialization-adt`.
The audit uses TypeScript AST parsing and source-level assertions for the changed runtime slice. It is not a full semantic typecheck, test run, package build, or CLI end-to-end proof.
