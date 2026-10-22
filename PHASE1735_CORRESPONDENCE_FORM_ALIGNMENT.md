# RouteSync Phase 1735 — Correspondence Form Alignment

## Scope
Interface-first contract refinement. No publication authority implementation or production wiring was added, and no full package build was run.

## Trace findings
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`: `InvocationSemanticCoveragePublicationCorrespondence` previously accepted an unrestricted inventory-entry type and an unrestricted publication-entry type. This allowed an ordinary inventory entry to be paired with a static publication entry at the type level.
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`: the scanner boundary already prohibited semantic repair, but did not state that it must preserve a source-form-specific correspondence pair.
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`: invocation analysis already delegates to `invocationSemanticPipeline.analyzeKnowledge(semanticKnowledgeDataFlow)`; this delegation remains unchanged.

## Interface changes
- Replaced the broad correspondence interface with a discriminated union:
  - `ordinary-invocation-coverage-correspondence` pairs only ordinary inventory and publication entries.
  - `static-invocation-coverage-correspondence` pairs only static inventory and publication entries.
- Added `correspondenceFormAlignment` to the coverage contract. The invariant states that type-level form pairing does not replace runtime identity and source-evidence validation.
- Added `publicationCorrespondenceFormAlignment` to the Laravel scanner boundary. The scanner preserves typed pairings and does not repair cross-form mismatches.
- Contract versions advanced to coverage v27, pipeline v44, and Laravel scanner boundary v23. Historical audit expectations from Phase 1721–1734 were synchronized.
- No duplicate publication-authority interface was created; the existing `InvocationSemanticCoveragePublicationInterface` remains the single operational interface.
- `core/src/semantic/foundation` was not introduced.

## Verification
- Phase 1735 interface audit: 12/12 passed.
- Direct audit regression, Phase 1721–1735: 210/210 checks passed across 15 phase reports.
- Existing overlapping regression suites: Phase 1721–1725 75/75, Phase 1721–1726 90/90, Phase 1721–1727 109/109. These suites overlap and must not be summed as unique checks.
- Targeted TypeScript check exited 2 with 34 diagnostics in existing `packages/core/src/types/domain/resourceModel...` files; no diagnostics referenced either modified interface file. This is not a clean project typecheck.
- Full package build was not run.
- ZIP integrity was checked after packaging.

## What remains open
The union prevents cross-form pairings at compile time. It cannot prove runtime equality of `KnowledgeId`, source span, or source evidence. The publication authority implementation must still validate identity, evidence, uniqueness, cardinality, and judgment binding before minting a validated receipt. Production wiring remains pending.

## Official references
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript Unions and Intersection Types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
