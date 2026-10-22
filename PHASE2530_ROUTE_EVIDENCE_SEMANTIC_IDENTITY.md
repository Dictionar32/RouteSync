# Phase 2530 — Route Evidence Semantic Identity

## Scope and source snapshot

This change is based on the latest RouteSync archive available in the conversation library: `RouteSync-Phase2512-TypeHasher-Upstream-Interface-Relation-Cutover.zip`. It is not a claim that an unavailable local working tree or a newer unuploaded phase was modified.

## Root-cause audit

1. `RequestTypeDerivationSourceEvidenceInventoryInterface` previously exposed only `inventory`. Route, resource, and request semantic-key policy was implicit in the inventory implementation rather than expressed as upstream operations.
2. The inventory implementation lived under `compiler/semantic`, although its identity policy is part of the upstream evidence contract.
3. Resource evidence used the raw resource name as its semantic key even though the declared policy requires canonical case-insensitive resource identity.
4. The source-occurrence verifier reconstructed semantic keys independently. Its location lookup could select the first source with a matching semantic key instead of matching the declaration coordinates, conflating semantic identity with source occurrence.
5. The default `routeManifestTypeLowering` still invokes `requestTypeDerivationProjectionPipeline.derive`. The inventory is evidence beside that legacy projection; it is not proof that the default manifest path consumes a complete semantic judgment. This remains an explicit open architectural gap and is not disguised as fixed by this phase.

## Implemented changes

- Extended the existing upstream `RequestTypeDerivationSourceEvidenceInventoryInterface` with `canonicalRouteIdentity`, `canonicalResourceIdentity`, and `canonicalRequestIdentity` operations.
- Added closed, discriminated canonical-identity ADTs and attached the correlated ADT to each route/resource/request evidence-reference variant.
- Made resource identity canonicalization use a typed `ResourceName` and a case-insensitive semantic key at the upstream owner.
- Moved the inventory implementation to `packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts`; the implementation is exported as a value explicitly typed by the existing interface, not as an exported factory function or loose identity helper.
- Updated the source-occurrence verifier to validate keys through the canonical upstream operations and to match source declarations by file/start/end coordinates. A resource identity mismatch now emits the existing `resource_identity_is_canonical` law failure with typed expected/actual canonical identity ADTs, instead of being mislabeled as a generic evidence-key mismatch.
- Connected both manifest-lowering paths to the same upstream inventory operation object.
- Exported the existing inventory interface and canonical identity ADTs through the public core type barrel, and exported the operation through the core barrel.
- Added `audit:phase2530-route-evidence-semantic-identity`.

## Verification evidence

- `audit-phase2530-route-evidence-semantic-identity.cjs`: **24/24** assertions passed.
- `audit-phase2428-active-request-type-source-evidence.cjs`: **9/9** checks passed.
- TypeScript syntax transpilation for seven changed TypeScript files: **7/7** passed.
- Targeted TypeScript diagnostics for the upstream contract, upstream inventory implementation, and source-occurrence verifier: **0 diagnostics** in those three files. The transitive program still reports existing workspace diagnostics; this is not a full project typecheck or build.
- The older `phase1561`, `phase1562`, `phase1563`, and `phase2506` audits have known failures in the unmodified Phase 2512 baseline as well; they are not reported as passing.

## Remaining work

The next root-cause task is to close the default manifest path over the existing complete semantic judgment/proof pipeline. Do not wrap the legacy `RequestType[]` solver output in a fabricated verified judgment. The current composition assembler requires real reasoning, verification, decision, and authority implementations to be wired before that cutover can be considered complete.
