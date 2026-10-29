# Phase 3036 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Objective

Continue the upstream-first runtime audit from the actual CLI manifest path. This phase migrates semantic object-identity pair matching and alias deduplication away from locally serialized pair keys and onto typed `KnowledgeId` domain operations.

## Runtime trace

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed CLI manifest scan operation.
2. The scan delegates through controller invocation manifest composition.
3. `packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts` consumes semantic data-flow assignment evidence.
4. `semanticObjectIdentityOperations.sameUnorderedPair` compares pairs through `semanticKnowledgeIdOperations.same`.
5. Alias assignment matching, evidence matching, and alias deduplication use typed pair identity.
6. The existing declarative rewrite solver still derives `may-alias`, `identity-link`, and alias judgments, and preserves closed/incomplete outcomes.

## Code changes

- Added `SemanticKnowledgeIdPair` and `SemanticKnowledgeIdPairEquality` ADTs.
- Added focused behavioral assertions for ordered versus unordered pair equality and source-provenance distinction (test source added; not executed in this dependency-free workspace).
- Added `SemanticObjectIdentityOperationsInterface` and `semanticObjectIdentityOperations` as an interface-backed upstream object.
- Removed `pairKey` and serialized left/right pair keys from `semanticObjectIdentityAuthority.ts`.
- Migrated alias-pair matching and alias evidence matching to `sameUnorderedPair`.
- Replaced string-key `typedDistinct` use for alias relation output with domain-aware alias deduplication.
- The direct same-identity seed now uses `semanticKnowledgeIdOperations.same` rather than comparing derived keys.

## Explicit boundary / non-claims

The existing rewrite solver accepts primitive text atoms. `knowledgeIdKey` is therefore still used at the solver adapter boundary to encode/decode `KnowledgeId` references. This phase does **not** claim that string representation has disappeared from the whole identity subsystem or repository. It removes local pair-key serialization from this consumer and moves identity decisions to typed operations. Eliminating text atoms requires a separate migration of the rewrite solver's term/atom contract and all its consumers.

The orchestration branch that preserves the solver's `closed` versus `incomplete` judgment remains intentionally intact. Parser boundary primitives and necessary execution control flow are not mechanically deleted.

## Verification

Run:

```sh
npm run audit:phase3036-semantic-object-identity-domain-operations
```

This is a static contract audit, not a substitute for TypeScript typecheck, Vitest, or a CLI-to-manifest end-to-end test. Those checks remain unverified while dependencies are absent.

The deleted generic relation-foundation modules under `packages/core/src/semantic/relations/` are not restored. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
