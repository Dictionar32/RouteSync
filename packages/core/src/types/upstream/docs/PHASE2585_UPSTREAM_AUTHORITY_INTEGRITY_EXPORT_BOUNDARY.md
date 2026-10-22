# Phase 2585 — Upstream Authority Integrity Export Boundary

## Root-cause finding

The upstream authority integrity operation already exists in `types/upstream`, but the package entry `packages/core/src/index.ts` did not export its gate or integrity factory. This made the capability harder to compose from the CLI/application composition root without importing internal source paths.

## Implemented

The core public entry now exports:

- `createRequestTypeDerivationAuthorityIntegrityGate`
- `RequestTypeDerivationAuthorityIntegrityGateInterface`
- `RequestTypeDerivationAuthorityIntegrityGateResult`
- `createRequestTypeDerivationSemanticAuthorityIntegrity`

This is an export-boundary correction only. It does not move semantic work into the CLI and does not add a duplicate contract.

## Important remaining gap

`requestTypeDerivationSemanticPipelineAssembler.ts` does not yet wire the integrity gate into the assembled pipeline. The public export makes the existing operation composable, but it does **not** claim the integrity check is now executed by CLI. Integrating it safely requires evolving the pipeline's closed result ADT to represent `integrity_rejected` without converting it into a fabricated semantic assessment, then updating operation preparation and consumers to handle that variant exhaustively.

The larger production blocker remains unchanged: there is no complete production reasoning/verifier/decision/authority capability bundle. The legacy `RequestType[]` solver must not be promoted into a proof-backed judgment without building the missing proof production and independent verification.

## Validation

Run `node scripts/audits/audit-phase2585-upstream-authority-integrity-export.cjs` for the export-boundary structural audit. This audit does not replace typecheck, package build, unit tests, or CLI end-to-end verification.
