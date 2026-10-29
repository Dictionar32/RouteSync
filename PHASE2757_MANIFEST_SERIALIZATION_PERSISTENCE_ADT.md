# Phase 2757 — Manifest Serialization and Persistence ADT

## Runtime trace

`CLI scan -> ManifestContractValidationJudgment -> ManifestGenerator.save -> ManifestSerializationJudgment -> ManifestPersistenceJudgment -> CLI success or explicit rejection`.

## Runtime changes

- `ManifestSerializer.ts` now returns a closed `ManifestSerializationJudgment`: `manifest_serialization_complete` or `manifest_serialization_rejected`.
- Serialization exceptions are represented as a rejection arm rather than escaping as an untyped control-flow outcome.
- `ManifestGenerator.save` returns `ManifestPersistenceJudgment`: `manifest_persistence_complete`, `manifest_persistence_serialization_rejected`, or `manifest_persistence_write_rejected`.
- `scan.ts` exhaustively handles persistence outcomes and does not continue reporting a successful scan after serialization or manifest-write failure.
- Optional preservation of existing `frontend` and `pages` remains best-effort; failures reading optional prior configuration do not override the new manifest result.

## Audit

Run `npm run audit:phase2757-manifest-serialization-persistence-adt`.

The audit checks TypeScript AST syntax and structural source invariants. It is not a substitute for semantic typecheck, unit tests, package build, or CLI end-to-end testing.

## Reference

TypeScript interface contracts and discriminated unions:
- https://www.typescriptlang.org/docs/handbook/interfaces.html
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html
