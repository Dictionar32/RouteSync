# Phase 2760 — Public Barrel Coverage for Explicit Manifest ADTs

## Runtime trace

`CLI entrypoint -> upstream composition -> controller invocation inventory -> manifest builder -> AST/source model -> manifest contract validation -> serialization -> persistence -> CLI terminal result`.

## Changes

- Expanded the core barrel export for the canonical manifest-builder ADT, including the source-AST blocker, source-model blocker, nested blocker union, and the corresponding terminal judgments.
- Expanded the CLI generator barrel to export the runtime operation values alongside their complete judgment, violation, serialized-manifest, generation, persistence, and interface contracts.
- Re-exported the manifest runtime API from the CLI package entrypoint so package consumers do not need deep imports.
- Kept canonical contract definitions in their existing owning modules; no duplicate ADT definitions were introduced.

## Runtime invariants

- `manifest_contract_rejected` prevents serialization and persistence.
- `manifest_serialization_rejected` prevents persistence.
- Persistence success is represented only by `manifest_persistence_complete`.
- Manifest-builder AST and source-model blockers remain distinct ADT variants.

## Audit

Run `npm run audit:phase2760-public-barrel-explicit-adt-runtime`.

This is a source-level structural audit. It does not replace full semantic typechecking, package build, unit tests, or CLI end-to-end tests.

## References

- TypeScript interfaces: https://www.typescriptlang.org/docs/handbook/interfaces.html
- TypeScript narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
