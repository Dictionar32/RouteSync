# RouteSync Phase 2645 — Semantic Preparation Packet Flow

## Scope

This phase repairs the typed data path from manifest preflight to the existing upstream RequestType derivation operation. It does not claim to implement the missing semantic producer or the independent verifier for the complete canonical-law set.

## Root cause

Before this change, `routeManifestRequestResolutionPreflight` prepared a full semantic packet but exposed only `prepared.input` as the input to lowering. The packet's `identityCollisionInventory`, request/resource resolution ledgers, and assessments were therefore available as adjacent preflight fields but were not passed together through `createRequestTypeDerivationOperationPreparation` to `pipeline.derive`.

## Changes

1. `RequestTypeDerivationSemanticInputPreparation` now extends `RequestTypeDerivationInput`, preserving the raw routes/resources/requests at the packet's top level while retaining the original `input` and prepared evidence/ledgers.
2. `prepareRequestTypeDerivationSemanticInput` returns that complete packet, including the source fields at the top level.
3. `RouteManifestRequestResolutionPreflight` exposes `semanticInput` with the exact upstream preparation type.
4. Manifest preflight stores the original `prepared` packet as `semanticInput`.
5. `routeManifestTypeLoweringAuthority` passes `preflight.semanticInput` to operation preparation rather than passing `preflight.input`.
6. The operation-preparation interface accepts the prepared packet, not raw-only input, making the intended boundary explicit.
7. Added `audit:phase2645-semantic-preparation-packet-flow` and its structural audit script.

## Structural audit

Command:

```sh
node scripts/audits/audit-phase2645-semantic-preparation-packet-flow.cjs
```

Result: 9/9 assertions passed.

## Verification limits and remaining root cause

- `tsc --noEmit --pretty false` could not run successfully in this workspace: the installed TypeScript compiler does not recognize the repository's `es2025` target/lib settings and required `node` and `vitest/globals` type definitions are absent. This is an environment/dependency failure, not a successful typecheck.
- Package build and Vitest were not run because workspace dependencies are absent.
- This phase does **not** invent a production semantic reasoning producer or verifier. The existing `requestTypeDerivationProductionComposition.ts` explicitly documents that concrete production reasoning/verifier/decision/authority capabilities are not shipped. Therefore the complete CLI path still fails closed when those capabilities are not supplied.
- The generic pipeline's default inference input remains `RequestTypeDerivationInput`. The enriched packet is passed at runtime and is structurally assignable to that source-input contract; a future concrete producer should specialize its inference input to `RequestTypeDerivationSemanticInputPreparation` so the compiler enforces consumption of all prepared fields. This phase fixes the lost packet wiring but does not claim that every semantic law has been independently verified.

## Architecture constraints

- No `core/src/semantic/foundation` dependency was added.
- No duplicate semantic authority or fallback was introduced.
- CLI remains a consumer/projection boundary, not a semantic reasoning implementation.
- Source semantic identity and source occurrence identity remain separate.
