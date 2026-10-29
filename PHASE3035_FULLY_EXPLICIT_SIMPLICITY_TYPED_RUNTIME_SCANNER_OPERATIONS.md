# Phase 3035 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Goal

Continue the upstream `KnowledgeId` migration through the invocation semantic algebra used by the CLI-to-manifest path. Identity decisions must use the upstream domain operation rather than a serialized key string.

## Runtime trace

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed CLI manifest scan operation.
2. Controller invocation manifest composition delegates to upstream invocation semantic judgment.
3. `packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts` resolves invocation presence, candidate callables, positional evidence, effects, obligations, and trace subjects.
4. Identity comparisons now use `semanticKnowledgeIdOperations.same`, whose domain identity includes source provenance, semantic role, and slot.
5. Existing judgments, source evidence, effect flows, and unresolved obligations continue through the current composition path.

## Implemented

- Removed the `knowledgeIdKey` import and local string-key helper from `invocationSemanticJudgmentAlgebra.ts`.
- Replaced KnowledgeId equality comparisons with the upstream typed identity operation.
- Candidate callable lookup now collects target IDs and deduplicates candidates by typed identity rather than `Set<string>` / mapped string keys.
- Declared emission lookup now matches IDs through typed identity rather than a string-key set.
- Positional argument evidence, obligation identity, trace subject validation, and invocation query projections use the same domain identity operation.
- Preserved existing output judgments, source evidence, effect-flow derivation, and unresolved-obligation behavior.

## Explicit limits

This phase is a consumer-level migration, not a claim that the repository contains no primitive values or control flow. `map`, `filter`, `flatMap`, `if`, and ADT dispatch remain in other parts of the algebra where they perform projections or handle distinct judgment variants. Removing these mechanically would risk changing ordering, evidence, or blocked outcomes. `semanticObjectIdentityAuthority.ts` still has a legacy relation-atom boundary and is a separate domain migration; no deleted relation foundation is restored.

## Verification

Run `npm run audit:phase3035-invocation-semantic-algebra-typed-identity`. This is a static contract audit. Full TypeScript typecheck, Vitest, and CLI-to-manifest end-to-end execution are not claimed unless separately run successfully.
