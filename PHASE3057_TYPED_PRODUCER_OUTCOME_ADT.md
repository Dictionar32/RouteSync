# Phase 3057 — Typed PHP Semantic Producer Outcome ADT

## Purpose

Expose a typed producer outcome on the real PHP AST semantic production boundary so callers can receive either a produced semantic model or a blocked model with typed validation violations. This advances the typed continuation path without breaking older graph-only consumers in one incompatible change.

## Runtime path

`PHP AST block → phpAstSemanticKnowledgeDataFlowProductionOperation.produceWithOutcome → semantic validation ADT → produced | blocked → upstream/CLI consumer migration`

The public `semanticKnowledgeDataFlowProducer` now also exposes `produceWithOutcome`. The existing `produce` operation remains a compatibility path and still returns a graph-shaped model; it delegates to the new typed outcome and preserves the historical error behavior for blocked models.

## Outcome contract

- `produced`: contains the exact source-backed `SemanticKnowledgeDataFlow` model.
- `blocked`: contains the same model and typed `SemanticKnowledgeDataFlowViolation[]`.

The operation does not discard the source facts, data-flow facts, derived relation projection, closure, mod/ref facts, or typed validation violations. The blocked result is data; the compatibility method remains the only path in this change that turns blocked validation into a thrown error.

## Scope and limitations

- The new method is available to migrate runtime consumers incrementally.
- Existing consumers still calling `produce` have not all been migrated to branch on the outcome ADT.
- This phase does not claim removal of every primitive, branch, or compatibility path.
- No deleted generic relation foundation was restored.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- Full repository typecheck and CLI-to-manifest end-to-end tests are not claimed by the structural audit.

## Verification

- Phase 3057 structural audit: 10/10 passed.
- Phase 3056 regression audit: 10/10 passed.
- `package.json` parses successfully.
- Protected `collections.ts` remains exactly one newline byte.
- Deleted generic relation foundation files remain absent.
- Strict TypeScript on the PHP producer dependency closure still fails with 773 diagnostics, primarily from deleted relation imports and consequent typing errors. This phase does not claim build-clean status.
- CLI-to-manifest end-to-end execution was not run.

Run `npm run audit:phase3057-typed-producer-outcome` from the repository root.
