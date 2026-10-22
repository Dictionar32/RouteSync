# RouteSync Phase2437 — Source Occurrence Interface Verifier

## Implemented

- Replaced the standalone source-occurrence result ADT with `createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier(delegate)`.
- The operation implements the existing `RequestTypeDerivationProofVerificationInterface<TContract, TInference>` and preserves the exact inference packet in `RequestTypeDerivationSemanticVerificationFor`.
- Source-occurrence failures use the canonical `RequestTypeDerivationVerificationFailure` variants; no local `verified` success result exists.
- When the source-occurrence guard passes, the original injected verifier is called to verify the remaining laws. This component cannot claim a complete proof is valid by itself.
- `createRequestTypeDerivationSemanticPipelineAssembler` now wraps the injected verifier with this guard before executing the pipeline.
- Exported the decorator and its guarded-law declaration from `packages/core/src/index.ts`.
- Added `npm run audit:phase2437-source-occurrence-interface-verifier` and a focused audit.
- Added/upgraded documentation. No imports from `semantic/foundation` or `semantic/relations` were added to the new operation.

## Verification evidence

- Phase2437 source-occurrence interface verifier audit: **12/12 passed**.
- Phase2434 upstream coverage audit: **5/5 passed**.
- Phase2433 manifest CLI regression/authority trace audit: **5/5 passed**.
- Phase2391 pipeline/executor injection audit: **10/10 passed**.
- Phase2419 active manifest interface-first audit: **13/13 passed**. This audit intentionally still reports that active RequestType manifest lowering uses the legacy path and authority-backed projection is not wired into active CLI projection.
- Focused TypeScript invocation emitted no diagnostics in the two modified TypeScript files, but the invocation still failed due to pre-existing diagnostics in imported/unrelated source files (notably `semantic/relations/relationalSequence.ts` and `semanticRelationalAlgebra.ts`).
- Full workspace typecheck/build/CLI integration tests were not successful or claimed. Root `tsconfig.json` also targets `ES2025`, which the available global TypeScript 5.8.3 compiler rejects, and the repository has existing parse errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`.

## Remaining boundary

This change wires source-occurrence checks into the existing verifier interface and pipeline assembler. It does not implement the missing complete reasoning/verifier/decision/authority capabilities, and it does not migrate `scan.ts`/`sync.ts` away from the active legacy RequestType projection path. A real complete verifier must still validate all remaining contract laws.
