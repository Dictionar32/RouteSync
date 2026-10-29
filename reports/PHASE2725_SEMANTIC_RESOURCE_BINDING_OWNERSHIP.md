# Phase 2725 — Semantic Resource Binding Ownership

## Changes applied to runtime source

Moved the Resource -> Model binding ADT from `packages/core/src/compiler/scanner/symbols/resource/resourceBindingTypes.ts` to `packages/core/src/compiler/semantic/resource-model/resourceModelBinding.ts`.

The semantic module now owns:

- `ResourceModelBinding` ADT and the `mono`, `poly`, and `unbacked_dto` variants.
- `ResourceModelBindingMatcherInterface` plus `resourceModelBindingMatcher: ResourceModelBindingMatcherInterface = Object.freeze({ match: ... })`.
- `ResourceModelBindingFactoryInterface` plus `resourceModelBindingFactory: ResourceModelBindingFactoryInterface = Object.freeze({ mono, poly, unbackedDto })`.

Removed the exported free function `matchResourceModelBinding` and exported class `ResourceModelBindingFactory`. The actual runtime consumers in `ResourceModelResolver.ts` and `resourceBinder.ts` now call `resourceModelBindingMatcher.match(...)` and `resourceModelBindingFactory.mono(...)`. The SDK regression test was migrated to those operations. The old scanner-owned implementation file was deleted; the scanner barrel is now only a compatibility re-export of semantic-owned types/operations.

## Upstream CLI manifest trace audited

```text
CLI executable
  -> routeSyncStandaloneCompositionLoader.load(...)
  -> routeSyncCliProgramFactory.createFromSemanticComposition(...)
  -> routeSyncCliUpstreamCompositionFactory.compose(
       controllerInvocationManifestCompositionAuthority,
       semanticComposition
     )
  -> requestTypeDerivationProductionPipelineAssembler.assemble(...)
  -> composition.manifestScanOperation.scan(input)
  -> controllerInvocationManifestCompositionAuthority.compose(input)
  -> canonical source-project identity
  -> source discovery
  -> source-document reads and identity binding
  -> invocation semantic judgments
  -> inventory authority closure
  -> manifest builder preparation/build
  -> manifest_builder_complete | manifest_builder_blocked
  -> CLI projection preflight and typed projection judgment
  -> scan/sync output
```

The manifest audit confirms that the builder receives a validated inventory receipt and rejected inventory remains rejected. The scan and sync commands use the same composed `manifestScanOperation.scan(...)`; projection is gated by the upstream semantic ADT.

## Audit results

- `npm run audit:phase2725-semantic-resource-binding-ownership`: **13/13** static checks passed.
- `npm run audit:phase2686-upstream-cli-manifest-builder-runtime-trace`: **12/12** static checks passed after updating stale assertions to the current composition path.
- `npm run audit:phase2724-semantic-resource-matcher-ownership`: **16/16** passed.
- `npm run audit:phase2723-resource-model-runtime-interface`: **14/14** passed.
- `npm run audit:phase2722-typed-resource-runtime-semantic-ownership`: **16/16** passed after updating its changed-file inventory to the moved semantic owner.
- Zip integrity is checked separately before delivery.

These are static source/contract checks, not a claim that the full project builds. `node_modules` is absent in this workspace; TypeScript typecheck, unit tests, build, and CLI end-to-end execution have not been verified.

## Remaining source debt (not hidden)

- Imports of the deleted `relationFoundation` still exist across **28 TypeScript files**. This phase does not recreate `relationFoundation` or add a renamed substitute. These references need to be migrated to the actual owning semantic contracts one dependency group at a time.
- Scanner is not yet fully wiring-only; implementations remain in other scanner directories. This phase moves only the Resource binding ADT/matcher/factory ownership.
- Historical generated bundles and phase-specific audit scripts may contain snapshots of the old path; the live TypeScript imports under `packages` no longer reference `resourceBindingTypes`.

## TypeScript reference

The interface-first operation-object pattern is aligned with TypeScript's documented object contracts and readonly properties:
- https://www.typescriptlang.org/docs/handbook/2/objects
- https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
