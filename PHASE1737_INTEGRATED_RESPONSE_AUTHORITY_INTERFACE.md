# Phase 1737 — Integrated Response Authority Interface

## Scope

This phase evolves upstream contracts before wiring. It does not implement the integrated-response authority or change production scanner wiring.

## Trace findings

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` already modeled an integrated response as analysis plus publication outcome.
- The previous type allowed a validated publication to be paired with an independently supplied analysis without a distinct authority interface for validating that cross-result binding.
- A publication receipt can be valid for its own inventory and still not prove that it corresponds to the exact analysis carried by an integrated response.
- `packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts` continues to delegate whole-knowledge analysis through `invocationSemanticPipeline.analyzeKnowledge(semanticKnowledgeDataFlow)`.

## Interface changes

- Added `InvocationSemanticIntegratedResponseAuthorityBoundaryContract` v1 and its exported canonical value.
- Added `InvocationSemanticIntegratedResponseAuthorityInput`, `InvocationSemanticIntegratedResponseAuthorityInterface`, and domain-specific integrated-response violations/rejection types.
- Evolved `InvocationSemanticIntegratedResponseContract` v1 to v2.
- A successful integrated response carries the validated publication and the authority boundary that governs cross-result validation.
- A rejected integrated response carries a typed rejection cause and analysis, but cannot expose a validated publication receipt.
- Integrated-response violations distinguish analysis judgments missing from publication, published judgments missing from analysis, and source-evidence mismatch.
- Updated `InvocationSemanticPipelineContract` v45 to v46 to include the integrated-response authority boundary.
- Updated `LaravelControllerInvocationSemanticBoundaryContract` v24 to v25 so the scanner consumes only upstream-authority-validated integrated responses.
- Exported the new authority contract and domain types through `packages/core/src/index.ts`.

## What remains unimplemented

- Runtime implementation of publication authority.
- Runtime implementation of integrated-response authority.
- Laravel scanner wiring to those authorities.
- Runtime fixtures for mismatch, missing/extra judgment, duplicate identities, and source-evidence mismatch.
- Full package typecheck/build.

The scanner remains a collection/delegation boundary. No `core/src/semantic/foundation` dependency was introduced.

## Verification

- Phase 1737 direct audit: 16/16 PASS.
- Direct audit reports Phase 1721–1737: 241/241 checks PASS.
- Targeted TypeScript command exited 2 due to 88 diagnostics in existing `packages/core/src/types/domain/resourceModel...` files. No diagnostics referenced the two changed upstream interface files.
- A broader typecheck including `packages/core/src/index.ts` also found existing missing exports and duplicate identifiers in that entry file; this phase does not claim the project typechecks.
- `npm run build` was not run.

## Official references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript Unions and Intersection Types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html

These references support interface-based compiler boundaries and discriminated unions. They do not replace runtime validation of identity and source evidence.


## Superseded by Phase 1738

The separate `InvocationSemanticIntegratedResponseAuthorityInterface` introduced in this phase was removed after a follow-up trace found duplicated correspondence ownership with `InvocationSemanticCoveragePublicationInterface`. See `PHASE1738_PUBLICATION_RECEIPT_SINGLE_AUTHORITY.md`: the publication receipt now owns the exact analysis and judgment correspondence ledger.
