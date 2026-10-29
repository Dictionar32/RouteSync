# Phase 3041 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Goal

Move mod/ref-relevant fact classification out of the object-identity contract into a dedicated upstream fact-domain operation. A semantic fact must continue into either a source-backed blocker or an explicit irrelevant-fact result; the caller must not reconstruct the meaning through its own `switch`.

## Implementation

- Added `packages/core/src/types/upstream/semanticModRefFactOperations.ts`.
- `SemanticModRefFactOperationsInterface.assess(fact)` returns a closed `SemanticModRefFactAssessment` ADT.
- Both ADT branches expose `continueWith`, so consumers can continue from a blocker or irrelevant fact without unpacking the result themselves.
- Blockers retain the original `KnowledgeId` and `SemanticSource` for assignment, invocation, access, and unset facts.
- `semanticObjectIdentityOperations.modRefEvidence(model)` now delegates each fact to `semanticModRefFactOperations.assess` and collects only the typed blocker branch.
- Updated the Phase 3040 audit to follow the moved domain ownership instead of expecting the blocker implementation to remain inside `semanticObjectIdentityInterface.ts`.
- The result remains `mod_ref_evidence_not_derived`; no relation is fabricated and no generic relation foundation is restored.

## Runtime trace

`CLI manifest scan interface → controller invocation manifest composition → invocation semantic pipeline → canonical SemanticKnowledgeDataFlow → semanticObjectIdentityAuthority.analyze(model) → semanticObjectIdentityOperations.modRefEvidence(model) → semanticModRefFactOperations.assess(fact) → source-backed blocker continuation → integrated object identity response`.

## Verification

Run:

- `npm run audit:phase3041-modref-fact-domain-continuation`
- `npm run audit:phase3040-modref-source-blocker-coverage`
- `npm run audit:phase3039-object-identity-explicit-modref-coverage`
- `npm run audit:phase3038-object-identity-explicit-membership-operations`
- `npm run audit:phase3037-object-identity-domain-solver-boundary`

These are static audits. They do not replace full typecheck, Vitest, or CLI-to-manifest end-to-end verification.

## Remaining debt

- The discriminant dispatch remains centralized in the dedicated fact-domain module; this phase does not claim repository-wide removal of every `switch`, `if`, primitive, array, or collection operation.
- Mod/ref inference rules and callable effect summaries are still unimplemented. The blockers describe missing knowledge honestly.
- Do not restore `relationMembership`, `relationalSequence`, or `semanticRelations`, and do not create a duplicate generic relation foundation.
