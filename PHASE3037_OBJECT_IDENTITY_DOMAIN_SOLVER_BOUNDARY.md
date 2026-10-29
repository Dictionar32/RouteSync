# Phase 3037 — Fully Explicit Typed Runtime Scanner Operations

## Goal

Retire the semantic object-identity consumer from the legacy relation solver's string-atom boundary. Keep identity, alias evidence, provenance, and proof derivations in the existing upstream domain ADT. Do not restore `packages/core/src/semantic/relations/relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`; do not create a generic replacement foundation.

## Runtime trace

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed CLI manifest scan operation.
2. The CLI scan delegates into controller invocation manifest composition.
3. The composition path consumes upstream semantic evidence and invokes the semantic data-flow authorities.
4. `semanticObjectIdentityAuthority` receives `SemanticKnowledgeDataFlow` assignment evidence.
5. `semanticKnowledgeIdOperations` and `semanticObjectIdentityOperations` compare source-aware typed identities and pairs.
6. `invocationSemanticIntegratedResponseCompositionFactory` calls `semanticObjectIdentityAuthority.analyze(knowledge)` on the exact same canonical graph used by inventory and invocation analysis.
7. A domain-owned finite-evidence closure produces typed alias facts, evidence lists, and derivations. The object-identity consumer no longer serializes `KnowledgeId` through `knowledgeIdKey` or converts solver atoms back into objects.
8. The integrated response retains the derived `objectIdentity` judgment without duplicating the canonical knowledge graph; the CLI/controller composition path now actually executes the operation.

## Domain model

`semanticObjectIdentityInterface.ts` now owns a closed `SemanticObjectIdentityProofFact` ADT for assignment-reference evidence, identity links, and alias answers. `SemanticObjectIdentityProof` makes the closure contract explicit as `finite_domain_evidence` and retains derivation premises and conclusions.

`semanticObjectIdentityAuthority.ts` exports interface-backed operation objects and is now called by the runtime integrated-response composition:

- `analyzeSemanticObjectIdentityOperation`
- `semanticAliasAssessmentOperation`
- `semanticObjectIdentityAuthority`

The integrated-response contract version is advanced to 11 and the composition contract to 21 to record the new typed `objectIdentity` result.

Only `by_reference` assignments contribute alias evidence. Duplicate unordered pairs are merged while preserving every assignment ID in `evidence`; identity comparisons use canonical `KnowledgeId` domain operations. No generic relation solver, relation atom, `knowledgeIdKey`, or JSON serialization is used in this authority.

## Verification

- `audit:phase3037-object-identity-domain-solver-boundary`: static contract audit.
- Phase 3036 static audit updated to accept the later domain-owned closure migration.
- TypeScript compiler invocation reaches the changed files without reporting diagnostics for them, but repository-wide compilation remains blocked by unresolved imports from previously deleted `packages/core/src/semantic/relations/*` modules in other, unmigrated consumers.
- Vitest and full CLI-to-manifest end-to-end tests are not verified because workspace dependencies are unavailable.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.

## Explicit non-claims

This phase does not eliminate primitive representations repository-wide. PHP source text and offsets still have typed primitive representations at parser boundaries. Other consumers of the legacy relation solver must be migrated one domain at a time, preserving their own evidence and proof obligations.
