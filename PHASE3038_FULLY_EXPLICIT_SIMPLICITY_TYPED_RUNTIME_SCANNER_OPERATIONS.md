# Phase 3038 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

Continue from Phase 3037 without restoring deleted relation foundations. This phase moves three object-identity decisions behind domain-owned operations: KnowledgeId membership, unordered alias-pair membership, and selecting identity-link premises for a proof answer.

## Runtime trace

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed CLI manifest scan operation.
2. Controller invocation manifest composition invokes the upstream runtime pipeline.
3. `invocationSemanticPipeline.ts` passes the canonical `SemanticKnowledgeDataFlow` reference to `semanticObjectIdentityAuthority.analyze`.
4. The authority calls `semanticObjectIdentityOperations` for membership and evidence selection rather than local `.some`, `.filter`, or `.findIndex` queries.
5. The resulting aliases and proof derivations remain attached to `objectIdentity` in the integrated response.

## Domain model changes

`semanticObjectIdentityInterface.ts` now exposes closed membership judgments:

- `knowledge_id_present` / `knowledge_id_absent`
- `semantic_alias_pair_present` / `semantic_alias_pair_absent`

The operation contract also owns `identityLinkPremises`, so proof evidence selection follows the same typed pair-identity rules as alias matching. Alias deduplication retains all assignment evidence when two candidate relations describe the same unordered pair.

## Pattern migration

In `semanticObjectIdentityAuthority.ts`, collection lookup combinators `.some`, `.filter`, and `.findIndex` were removed from the consumer path. The consumer now delegates membership and premise selection to upstream domain operations. No generic relation foundation was introduced.

The `isAssignmentFact` TypeScript type predicate remains intentionally at the discriminated-fact boundary: it is a compile-time narrowing contract, not a runtime semantic operator, and removing it without a replacement ADT would either require an unsafe assertion or lose type information.

## Verification boundary

Run `npm run audit:phase3038-object-identity-explicit-membership-operations`. The audit is static. The full TypeScript typecheck, Vitest suite, and CLI-to-manifest end-to-end test are not claimed as verified while project dependencies are absent.

The deleted modules `relationMembership`, `relationalSequence`, and `semanticRelations` remain absent. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
