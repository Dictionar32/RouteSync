# RouteSync Phase 3009 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

This phase closes one concrete domain boundary in the live CLI manifest path: `ControllerInvocationManifestCompositionInput` used to be a tagged data object. The composition authority had to unpack `input.sourceProject`, call canonicalization itself, then carry the whole input through internal operations until it eventually read `input.routeSelection`. The input now owns the first legal domain continuation and is built through one explicitly typed factory.

## Implemented runtime shape

```ts
export const controllerInvocationManifestCompositionInputFactory:
  ControllerInvocationManifestCompositionInputFactoryInterface = Object.freeze({
    create: (sourceProject, routeSelection) => Object.freeze({
      kind: 'controller_invocation_manifest_composition_input',
      sourceProject,
      routeSelection,
      continueToCanonicalization: (canonicalization, continuation) =>
        canonicalization.canonicalize({
          kind: 'controller_source_project_identity_canonicalization_input',
          sourceProject,
        }).then(identity => identity.continueWith({
          onBlocked: continuation.onBlocked,
          onCanonicalized: canonicalIdentity =>
            continuation.onCanonicalized(canonicalIdentity, routeSelection),
        })),
    }),
  });
```

The example is schematic: the implementation uses `Object.freeze` on the canonicalization input as well. The actual runtime contract carries explicit parameter and return types.

## Runtime trace and field provenance

1. **CLI request origin**
   - `scan` and `sync` resolve `targetDir` and `options.input` at the command boundary.
   - `sourceProject` originates from `createLaravelSourceProjectIdentity.create(createSourceFile(targetDir))`.
   - `routeSelection` originates from `sourceFileInventoryFactory.empty().include(createSourceFile(path.resolve(targetDir, options.input)))`, then `laravelRouteSourceSelectionAuthority.explicitFiles(...)` and `.explicitIntent(...)`.
   - Drift audit uses the same input factory with the current working directory and `laravelRouteSourceSelectionAuthority.defaultIntent()`.
2. **Canonical request ADT**
   - `controllerInvocationManifestCompositionInputFactory.create(sourceProject, routeSelection)` preserves both typed values and binds `continueToCanonicalization` to that exact pair.
   - The CLI manifest scan operation forwards the input to `ControllerInvocationManifestCompositionAuthorityInterface.compose`.
3. **Source-project identity**
   - `input.continueToCanonicalization(...)` invokes the injected canonicalization authority with the original source project.
   - A blocked identity result becomes `controller_invocation_manifest_source_project_identity_blocked` and cannot proceed as a successful manifest.
   - A canonicalized identity continues with the exact `routeSelection` originally supplied to the input.
4. **Controller source discovery and read provenance**
   - Controller discovery is rooted at the canonical project root plus `app/Http/Controllers`.
   - The route-selection intent is not silently substituted for controller discovery inventory. It remains a separate input to the manifest builder.
   - Discovered controller source inventory flows through source reads, source identity binding, invocation semantic preparation, and inventory closure.
5. **Manifest builder input**
   - Inventory closure receives the validated invocation-inventory result and the same route-selection intent.
   - It prepares `ManifestBuilderInput` with `invocationInventoryReceipt` from the validated inventory and `routeSelection` from the CLI request.
   - Manifest builder results remain executable terminal ADTs. CLI scan/sync/drift consume them through `continueForDriftAudit`, rather than reclassifying terminal tags.
6. **Manifest output boundary**
   - The complete concrete manifest is projected to `RouteSyncManifestFlow` by the existing flow projection.
   - `invocationSemanticJudgments` is carried from the validated upstream manifest; it is emitted to `routesync.invocations.json` by the scan command. It is not reconstructed from CLI route output.
   - Route/model/resource projection and request-type resolution remain downstream consumers of upstream judgments; this phase does not create a second semantic authority or duplicate manifest model.

## Interface-first migration

- Added `ControllerInvocationManifestCompositionInputOperations` and `ControllerInvocationManifestCompositionInputContinuationInterface`.
- Added `ControllerInvocationManifestCompositionInputFactoryInterface` and `controllerInvocationManifestCompositionInputFactory` as `export const name: Interface = Object.freeze({...})`.
- `controllerInvocationManifestCompositionAuthorityFactory` now delegates its first effect to `input.continueToCanonicalization(...)`.
- Internal composition operations now pass the domain-owned `routeSelection` directly instead of carrying the entire input object only to extract that field later.
- CLI `scan`, `sync`, and drift audit now construct the input through the canonical factory. Raw composition-input literals were removed from those runtime call sites.
- No `export function` declaration was introduced in the traced production files. This phase does not claim repository-wide removal of exported functions or bare/inferred callables outside this runtime slice.

## Audit and verification

- Structural audit: see `PHASE3009_AUDIT.json`; the repeatable script is `scripts/audits/audit-phase3009-composition-input-domain-continuation.cjs`.
- TypeScript syntax transpilation: 5 changed TypeScript files, 0 syntax diagnostics.
- Full typecheck, unit tests, build, and Laravel CLI end-to-end were not validated. The available global TypeScript compiler is 5.8.3 and rejects this workspace’s `ES2025` target/lib; it also cannot find global built-ins and the `node` / `vitest/globals` type definitions. This is an environment/configuration blocker, not a successful typecheck. See `PHASE3009_TYPECHECK.log`; syntax transpilation and structural checks do not substitute for a full typecheck or E2E run.
- `packages/core/src/types/upstream/collections.ts` remains whitespace-only.
- The deleted `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` foundations remain absent and were not reintroduced.

## Laravel/PHP grounding

Laravel route definitions distinguish controller actions from closure routes, route parameters are bound according to documented conventions, and dependencies are injected through the service container. PHP's type declarations define accepted parameter and return types. The scanner therefore needs to preserve route selection, source identity, and invocation judgments as typed evidence with explicit provenance; CLI composition should transport those judgments, not infer Laravel semantics from primitive values downstream.

- Official Laravel Routing documentation: https://laravel.com/framework/docs/routing
- Official PHP Type Declarations manual: https://www.php.net/manual/en/language.types.declarations.php
