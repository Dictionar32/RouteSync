# Phase 2758 — Explicit Manifest Runtime ADT

## Runtime trace

`upstream CLI scan/sync -> manifest projection -> manifest contract validation -> manifest serialization -> manifest persistence -> CLI success or explicit rejected ADT`.

## Runtime changes

- Replaced `ManifestGenerator` static-class entrypoints with `manifestGeneratorOperations: ManifestGeneratorOperationsInterface = Object.freeze({...})`.
- Added `ManifestGenerationJudgment` with explicit complete/rejected variants.
- Added a persistence contract-rejected arm; persistence revalidates the manifest before serialization so every caller receives the same contract gate.
- Migrated CLI `scan`, CLI `sync`, and `scripts/scan-toko-online.ts` to consume the typed operation object and exhaustively branch over persistence outcomes.
- Kept serialization and contract validation behind their explicit typed operation objects.

## Audit

Run `npm run audit:phase2758-explicit-manifest-runtime-adt`.

This is a static AST/source audit. It does not replace semantic TypeScript typechecking, unit tests, package build, or CLI end-to-end verification.

## TypeScript references

- https://www.typescriptlang.org/docs/handbook/interfaces
- https://www.typescriptlang.org/docs/handbook/2/narrowing
