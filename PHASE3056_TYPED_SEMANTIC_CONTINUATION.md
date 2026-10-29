# Phase 3056 — Typed Semantic Validation Continuation

## Objective

Move the decision after semantic validation into a closed upstream ADT. The operation must return domain data rather than `void` or throw an exception to represent an expected rejected model.

## Changes

- Added `packages/core/src/types/upstream/semanticDataflowKnowledgeContinuation.ts`.
- Added `SemanticKnowledgeDataFlowContinuationOutcome` with `continue` and `blocked` cases.
- The blocked case preserves the original canonical `SemanticKnowledgeDataFlow` and the complete typed violation list.
- Added `SemanticKnowledgeDataFlowContinuationOperationsInterface` and the interface-typed `semanticKnowledgeDataFlowContinuationOperations` object.
- Exported the operation from the upstream barrel.
- Added `continueWithOutcome` to the PHP AST compatibility facade, delegating to the upstream continuation operation.
- Kept `continueAfterValidation` as a legacy compatibility API because the current producer contract still requires a `SemanticKnowledgeDataFlow`; that legacy method can still throw for invalid input. This phase does not claim that the existing producer/CLI path has fully switched to the new outcome yet.

## Verification

- Phase 3056 structural audit: `npm run audit:phase3056-typed-semantic-continuation`.
- Existing Phase 3054 and Phase 3055 audits are run as regressions.
- Focused strict TypeScript check covers the upstream validation and continuation modules and the compatibility facade where possible.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- Deleted relation foundation modules remain absent.

## Runtime trace and remaining frontier

Current producer path remains:

`PHP AST → SemanticKnowledgeDataFlow model → upstream validation ADT → compatibility continuation`.

The new typed continuation is exposed on the facade, but the current producer still uses the legacy `continueAfterValidation` because its public contract returns a graph rather than a production outcome. To complete the migration, a later phase must carry the `continue | blocked` outcome through the evidence projection and controller/CLI composition contracts, preserving source identity, evidence, provenance, and blocker details. Do not convert the blocked outcome back to an exception inside upstream.

The full upstream → CLI → manifest end-to-end path, full repository typecheck, and full test suite are not claimed as passing by this phase. No deleted relation foundation was restored or recreated under another name.
