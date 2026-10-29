# Phase 3042 — Fully Explicit Typed Semantic Fact Visitor Operations

## Purpose

The real CLI → manifest runtime continues to feed canonical `SemanticKnowledgeDataFlow` into upstream semantic analysis. The next interface lift is at the source-fact ADT: consumers should declare typed behavior for every semantic fact variant rather than repeatedly interpreting `fact.kind`.

## Change

- Added `packages/core/src/types/upstream/semanticFactOperations.ts`.
- Added `SemanticFactVisitor<R>` with a handler for each of the 37 current `SemanticFact` variants.
- Added interface-backed `semanticFactOperations.continueWith(fact, visitor)`. Its canonical boundary performs exhaustive discriminant dispatch and assigns the remainder to `never`, so new variants must be handled explicitly.
- Migrated `semanticModRefFactOperations.assess` to the typed visitor. It no longer contains a local `switch`; assignment, invocation, access, and unset still yield source-backed blockers, and other fact kinds remain explicitly irrelevant to this incomplete mod/ref analysis.
- Kept `semanticObjectIdentityOperations.modRefEvidence` and the CLI → manifest entry path on their existing interface-backed contracts.

## Runtime trace

`CLI manifest scan interface → controller invocation manifest composition → invocation semantic pipeline → canonical SemanticKnowledgeDataFlow → semanticObjectIdentityAuthority.analyze(model) → semanticObjectIdentityOperations.modRefEvidence(model) → semanticModRefFactOperations.assess(fact) → semanticFactOperations.continueWith(fact, exhaustive typed visitor)`.

## Important boundary

The visitor moves knowledge about each variant into an explicit typed contract; it does not magically remove the need to dispatch a runtime union. One exhaustive `switch` remains inside the canonical ADT boundary. Replacing it with an untyped `map`/lookup would hide rather than remove dispatch and would weaken exhaustiveness. Likewise, primitive types are still appropriate at parser/serialization boundaries; this phase does not claim global primitive elimination.

## Verification

- `npm run audit:phase3042-semantic-fact-visitor-operations`
- `npm run audit:phase3041-modref-fact-domain-continuation`
- `npm run audit:phase3040-modref-source-blocker-coverage`
- Targeted strict TypeScript check on the visitor, mod/ref operation, object identity contract/authority, and related regression test.

These checks do not replace full repository typecheck, complete Vitest, or CLI-to-manifest end-to-end verification.

## Preserved constraints

- No restoration of `relationMembership`, `relationalSequence`, or `semanticRelations`.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- No mod/ref relations are fabricated; blockers preserve `KnowledgeId` and `SemanticSource`.
