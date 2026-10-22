# RouteSync Phase 2641 — Distinct-Occurrence Identity Collision Repair

## Scope

This phase continues the active CLI → manifest → upstream path. It corrects the existing source-evidence identity inventory contract and keeps the requested `export const name: Interface` operation style. It does not claim to implement the missing production semantic reasoning/verifier kernel.

## Root cause found

The existing `duplicateIdentityWitnesses` implementation grouped records by canonical `semanticKey` but did not require distinct `occurrenceKey` values before emitting a duplicate witness. That contradicted the existing `RequestTypeDuplicateOccurrencePair` contract, which requires the second source occurrence to have a different occurrence key. Duplicate copies of the same parsed span could therefore be misreported as a source-identity collision. The semantic input preparation also reconstructed the collision ADT itself from an array, including a `as const` assertion, instead of delegating that closed result to the upstream inventory owner.

## Source changes

1. `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
   - Evolved the existing `RequestTypeDerivationSourceEvidenceInventoryInterface` with `identityCollisionInventory(input)` returning the existing closed `RequestTypeDerivationIdentityCollisionInventory` ADT.
   - No duplicate inventory interface was introduced.

2. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts`
   - Deduplicates candidate evidence by canonical source `occurrenceKey` within each route/resource/request identity group.
   - Emits a collision witness only when at least two distinct source occurrences share the same canonical semantic key.
   - Preserves additional distinct occurrence witnesses without repeating duplicate keys.
   - Exposes the closed collision ADT as `export const requestTypeDerivationIdentityCollisionInventory: RequestTypeDerivationSourceEvidenceInventoryInterface['identityCollisionInventory']`.

3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts`
   - Delegates collision ADT construction to the upstream identity inventory operation.
   - Removes local array-to-ADT reconstruction and its `as const` assertion.

4. Public exports and audits
   - Exported the operation through `packages/core/src/index.ts` and `packages/core/src/upstream.ts`.
   - Added `scripts/audits/audit-phase2641-distinct-occurrence-identity-collision.cjs` and package script `audit:phase2641-distinct-occurrence-identity-collision`.
   - Updated Phase 2640 structural audit expectations to follow the new owner operation.

## Active path

```text
Laravel source / manifest
  → routeManifestRequestResolutionPreflight.evaluate
  → requestTypeDerivationSemanticInputPreparation.prepare
  → requestTypeDerivationSourceEvidenceInventory.identityCollisionInventory
  → closed collision-free / collision-bearing ADT
  → manifest preflight retains that ADT
  → existing semantic pipeline / manifest projection
```

The preflight still preserves collision evidence rather than assigning semantic disposition. Only the reasoning capability may decide whether the source conditions imply a semantic conflict or another judgment outcome.

## Validation performed

- Phase 2641 distinct-occurrence collision audit: 10/10 assertions passed.
- Phase 2639 semantic input preparation interface-first audit: 10/10 passed.
- Phase 2640 identity collision inventory audit: 11/11 assertions passed.
- Phase 2638 CLI → manifest → upstream audit: 10/10 passed.
- Phase 2552 identity integrity audit: 8/8 passed.
- Phase 2538 producer root-cause audit: 8/8 passed.
- Phase 2534 canonical RequestType contract audit: 11/11 passed.
- Phase 2636 upstream manifest authority audit: 11/11 passed.
- Total structural assertions across these audits: 79/79.
- TypeScript syntax transpilation: 7/7 changed/importing TypeScript files passed.

A strict targeted `tsc --noEmit` attempt did not pass. The repository currently has broad unrelated missing dependency/type and source-contract errors (including missing `axios` declarations and existing export/type errors in `packages/core/src/index.ts`). Therefore no full typecheck, package build, Vitest, or Laravel end-to-end result is claimed.

## Remaining root cause

The production semantic reasoning producer and independent verifier for all 34 canonical laws are still absent. This phase repairs collision witness correctness and upstream ADT ownership, but does not fabricate a proof or claim the semantic kernel is complete. The next implementation should consume this preparation packet in a real producer/verifier path and then wire those capabilities through the existing pipeline assembler and CLI composition root.

## Laravel source reference

Laravel route declarations can use closures or controller actions, route files are loaded through application bootstrap configuration, and resource routes expand into multiple controller actions. Identity and source occurrence therefore need to remain separate, source-bound evidence domains rather than be inferred from a route name alone. Official reference: https://laravel.com/framework/docs/13.x/routing
