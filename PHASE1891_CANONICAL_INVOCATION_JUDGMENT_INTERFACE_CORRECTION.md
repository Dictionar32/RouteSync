# Phase 1891 — Canonical Invocation Semantic Judgment Interface Correction

## Decision

Remove the parallel `LaravelControllerInvocationSemanticJudgmentV2` family introduced in Phases 1888–1890. Those contracts duplicated the Laravel invocation judgment domain rather than strengthening its existing owner.

## Canonical interface changes

- `LaravelControllerInvocationSemanticJudgmentInterface` remains the only Laravel invocation judgment model.
- Its semantic contract advances to version 8 with explicit rules for canonical source identity, exact integrated-response provenance, and one canonical model.
- The judgment continues to bind `sourceFile` and the outcome-narrowed `response` in one value. The integrated response retains its existing four outcomes and exact upstream binding evidence.
- `LaravelControllerInvocationSemanticJudgmentInventoryInterface` remains the single inventory contract. It continues to close a one-to-one relation using the canonical judgment's `sourceFile`; no parallel inventory receipt or source-subject projection was introduced.
- `LaravelControllerInvocationSemanticBoundaryContract` advances to version 58 and explicitly assigns canonical judgment ownership, integrated-response provenance ownership, and source identity ownership to the scanner boundary.
- V2-only type files and their upstream/core barrel exports are removed. The historical Phase 1888–1890 audit commands are retained but now guard against reintroducing duplicate contracts.

## Runtime boundary

No scanner runtime implementation or wiring was changed. The implementation body of the invocation judgment authority and the inventory authority was not changed; the judgment authority file only updates its semantic contract value. `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` remains unchanged. No build or TypeScript compilation is claimed.

## Validation

Static audits from Phase 1871, 1872, and 1874–1891 pass. The new Phase 1891 audit checks the canonical model, source provenance, inventory consumer, scanner boundary, removed V2 exports/files, and absence of V2 invocation types under `packages/core/src`.
