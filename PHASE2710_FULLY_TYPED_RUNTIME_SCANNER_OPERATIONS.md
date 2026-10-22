# Phase 2710 — Fully Typed Runtime Scanner Operations

## Scope and root-cause correction

This phase continues from Phase 2709 and deliberately reuses the existing upstream owner:

- Contract: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
- Runtime owner: `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts`
- Source-occurrence verifier: `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts`

The root defect addressed here was not a lack of a generic wrapper. The upstream canonical route identity contained only `routeName` plus a serialized `semanticKey`, and collision/membership checks for route and request identities still used that serialized key as their equality authority. A key is a projection for ledgers and diagnostics; it is not a structural domain identity.

## Source changes

1. `RequestTypeCanonicalRouteIdentity` now carries typed structural `coordinates` (`method`, `path`, `name`) and typed structural `domain` (`resource`, `domain`, `group`). `semanticKey` remains for ledger projection and consistency laws.
2. The existing upstream `RequestTypeDerivationSourceEvidenceInventoryInterface` now owns `sameCanonicalRouteIdentity`, `sameCanonicalResourceIdentity`, and `sameCanonicalRequestIdentity` operations.
3. The actual runtime inventory object implements those operations as properties of `export const requestTypeDerivationSourceEvidenceInventory: RequestTypeDerivationSourceEvidenceInventoryInterface = Object.freeze({...})`.
4. Route and request duplicate-identity witnesses compare canonical structural domain fields rather than comparing `semanticKey` strings.
5. Source-occurrence membership and candidate-location lookup delegate route/resource/request identity comparison to those same upstream-owned operations. Serialized keys are still checked where the proof law explicitly validates ledger projection consistency; they are no longer used as the identity-equality authority in these paths.
6. No separate helper module was added. This reuses the existing upstream contract owner, as required.

## Runtime CLI → upstream manifest trace

```text
packages/cli/src/commands/scan.ts (and sync.ts)
  → composition.manifestScanOperation.scan(input)
  → packages/cli/src/manifestScanOperationInterface.ts
      routeSyncCliManifestScanOperationFactory.create(authority).scan(input)
  → packages/cli/src/upstreamCompositionFactory.ts
      routeSyncCliUpstreamCompositionFactory.compose(...)
  → packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts
      controllerInvocationManifestCompositionAuthority.compose(input)
  → source-project identity + route selection
  → controller source discovery + source-document acquisition
  → invocation source inventory and semantic judgments
  → packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts
      manifestBuilderOperationPreparation.prepare(input).build()
  → Laravel source AST pipeline + complete source model
  → dataflow judgments / resource-group capabilities
  → manifest_builder_complete OR manifest_builder_blocked
  → CLI consumes only the complete upstream judgment
```

The corrected identity subpath is:

```text
RequestTypeDerivationInput
  → requestTypeDerivationSourceEvidenceInventory.inventory(input)
  → typed canonical route/resource/request identities
  → upstream-owned structural equality operations
  → duplicate-identity witnesses / source-occurrence membership
  → source-occurrence verification and proof verifier
  → semantic authority
  → manifest projection only when the upstream judgment permits it
```

## Interface-first usage example

The runtime caller uses the upstream operation object, not a separately exported function:

```ts
const inventory = requestTypeDerivationSourceEvidenceInventory.inventory(input);
const sameRoute = requestTypeDerivationSourceEvidenceInventory.sameCanonicalRouteIdentity(
  inventory.routes[0].canonicalIdentity,
  inventory.routes[1].canonicalIdentity,
);
```

The caller must not infer identity equality from `semanticKey`. That string is retained for the explicit evidence-key and proof-ledger consistency laws.

## Audits and verification

- `node scripts/audits/audit-phase2710-structural-upstream-identities.cjs`: **12/12 PASS**.
- `node scripts/audits/verify-phase2710-identity-equality-runtime.cjs`: **4/4 PASS**. Fixtures prove same structural values compare equal and different structural values compare unequal even when a serialized key is deliberately made identical.
- `node scripts/audits/audit-phase2703-upstream-runtime-interface-operations.cjs`: **9/9 PASS**.
- TypeScript `transpileModule` syntax diagnostics: **0** for the three modified TypeScript files.
- A strict targeted `tsc --noEmit` attempt still exits nonzero with **79 diagnostics**, but the Phase 2709 baseline produces the same 79 diagnostic fingerprints: **0 new / 0 removed**. Existing issues include source-occurrence failure-evidence correlation and unrelated domain contracts. This is not a successful typecheck.
- Vitest and CLI scan/sync end-to-end were not run; this workspace has no local `node_modules/.bin/tsc`, `vitest`, or `turbo` toolchain. The runtime equality test uses TypeScript's transpiler available in the environment and mocks the unrelated `SemanticValueFactory` import.
- The traced upstream manifest-forming path files do not contain exported `function` declarations. There are still exported functions in other CLI modules (including post-manifest generators and annotation utilities); this phase does not claim the whole repository is free of them.
- The complete 34-law RequestType proof set is not claimed verified. `verification_incomplete` remains fail-closed.

## Next source-level work

The next required correction is to remove serialized-key dependence from the remaining verifier comparisons and model source occurrence identity as structural source coordinates while preserving its serialized key only as a projection. Then close the outstanding proof-witness type errors and run the actual CLI scan/sync integration suite. Do not paper over those failures with fallback results.

## TypeScript reference

The official TypeScript handbook describes interfaces as structural contracts and explains object/function typing: https://www.typescriptlang.org/docs/handbook/2/objects.html
