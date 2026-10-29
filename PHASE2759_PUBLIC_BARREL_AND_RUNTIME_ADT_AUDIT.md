# Phase 2759 — Public Barrel Alignment for Runtime Operations

## Runtime trace

`CLI scan/sync -> upstream composition -> controller invocation inventory -> manifest builder -> typed AST/source model -> manifest contract validation -> serialization -> persistence -> CLI terminal ADT`.

## Barrel changes

- Core barrel exports `semanticDataflowInputAdapterOperations` and its interface contract.
- Core barrel exports `routePayloadLocationOperations` and its interface contract.
- CLI generator barrel `packages/cli/src/generators/index.ts` exports the canonical validation, serialization, and generation operations with their types.
- This avoids pretending that CLI-only contracts belong to the core package barrel.

## ADT/runtime invariants

- Keep complete and rejected outcomes as explicit discriminated variants.
- Do not serialize or persist a manifest after contract rejection.
- Do not convert blocked AST/source-model results to an empty successful manifest.
- Export runtime values and their interface types from the owning package barrel.

## Audit

Run `npm run audit:phase2759-public-barrel-runtime-adt`.

This is a source/AST structural audit; it does not prove semantic type correctness, runtime behavior, package build, or end-to-end CLI behavior.

## References

- TypeScript interfaces: https://www.typescriptlang.org/docs/handbook/interfaces.html
- TypeScript narrowing/discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
