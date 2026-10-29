# Phase 3040 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Goal

Make the mod/ref coverage limitation actionable without inventing semantic relations. Phase 3039 correctly distinguished “not derived” from “derived”, but the blocker only named the missing rule family and did not identify the facts responsible for the gap.

## Implementation

- `SemanticModRefBlocker` is a closed ADT with source-backed variants for assignment effects, invocation effect summaries, access effects, and unset effects.
- Every blocker preserves its `KnowledgeId` and `SemanticSource` so the audit can point back to the exact upstream evidence.
- `SemanticObjectIdentityOperationsInterface.modRefEvidence(model)` now consumes the canonical `SemanticKnowledgeDataFlow` rather than returning a context-free status.
- `semanticObjectIdentityAuthority.analyze(model)` applies this operation to the same canonical graph used for alias/proof analysis.
- The result remains `mod_ref_evidence_not_derived`. This phase does not manufacture a complete empty relation set or claim the missing inference rules exist.

## Runtime trace

`CLI manifest scan interface → controller invocation manifest composition → invocation semantic pipeline → canonical SemanticKnowledgeDataFlow → semanticObjectIdentityAuthority.analyze(model) → semanticObjectIdentityOperations.modRefEvidence(model) → source-backed blocker ADT in integrated object identity response`.

## Verification

Run `npm run audit:phase3040-modref-source-blocker-coverage`. The audit checks the closed blocker variants, preserved fact identity and provenance, runtime operation usage, CLI trace, absence of deleted relation foundations, and the one-newline-byte `collections.ts` sentinel.

This is a static audit. It does not claim full TypeScript typecheck, Vitest, or CLI-to-manifest end-to-end success.

## Remaining debt

- Mod/ref inference rules and callable effect summaries remain unimplemented. The new blockers make the missing work explicit and source-locatable.
- Primitive types and control-flow constructs remain where required at parsing/model boundaries or in other domains. This phase is not a mechanical repository-wide replacement.
- Do not restore `relationMembership`, `relationalSequence`, or `semanticRelations`, and do not create a duplicate generic relation foundation.
