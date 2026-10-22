# RouteSync Phase 2640 — Upstream Identity Collision Inventory

## Scope

Evolve the existing `RequestTypeDerivationSourceEvidenceInventoryInterface` and connect canonical identity-collision evidence to the manifest preflight packet. This is source implementation, not only an audit change.

## Source changes

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
  - Extended the existing source-evidence inventory contract with `duplicateIdentityWitnesses`.
  - Added the closed `RequestTypeDerivationIdentityCollisionInventory` ADT (`identity_inventory_collision_free` / `identity_inventory_collisions`).
  - Added the collision inventory to the semantic input-preparation packet.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts`
  - Added `requestTypeDerivationDuplicateIdentityWitnesses` using `export const name: ExistingInterface['operation']`.
  - Preserves canonical semantic key, source-domain discriminator, and distinct occurrence references; repeated declarations are not collapsed into one source occurrence.
  - Reports collision evidence only; it does not decide whether the final judgment is conflict or invalid input.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts`
  - Includes the closed collision inventory in the preparation packet.
- `packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts` and `routeManifestRequestResolutionPreflight.ts`
  - Preserve the collision ADT across the manifest preflight boundary.
- `packages/core/src/index.ts`, `packages/core/src/upstream.ts`
  - Export the new operation and ADT through public surfaces.
- `scripts/audits/audit-phase2640-upstream-identity-collision-inventory.cjs` and `package.json`
  - Added a structural audit command.

## Verification

- Phase 2640 identity collision inventory: 11/11 assertions.
- Phase 2639 semantic input preparation: 10/10 assertions.
- Phase 2638 CLI → manifest → upstream path: 10/10 assertions.
- Phase 2552 canonical evidence identity: 8/8 assertions.
- Phase 2538 producer root-cause audit: 8/8 assertions.
- Phase 2534 canonical RequestType contract: 11/11 assertions.
- Phase 2636 upstream manifest authority trace: 11/11 assertions.
- Total: 69/69 structural assertions passed.
- TypeScript syntax transpilation: 7/7 changed TS files passed.
- `package.json` parsing passed.

`tsc --noEmit` was attempted and could not run successfully in this workspace: installed global TypeScript 5.8.3 does not support the project's configured target/lib, and local `node` / `vitest/globals` type declarations are absent. No full typecheck, package build, Vitest, or Laravel end-to-end run is claimed.

## Remaining root cause

This phase strengthens source identity evidence and carries it through manifest preflight. The production semantic reasoning producer and independent verifier for all 34 derivation laws remain absent. The new collision inventory is evidence for that future producer, not a semantic judgment or proof. The CLI remains fail-closed; no legacy solver, `semantic/foundation`, or relation dependency was introduced.
