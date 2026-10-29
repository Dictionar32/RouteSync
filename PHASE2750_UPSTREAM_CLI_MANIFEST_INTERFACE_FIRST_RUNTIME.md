# Phase 2750 — Upstream CLI Manifest Interface-First Runtime Operations

## Scope

This phase converts the live RouteManifest projection and integrated-manifest factory boundaries from exported free factory functions / inferred arrow-function exports into explicitly interface-typed runtime operation objects. The public API now exposes operation objects whose methods are the supported runtime entrypoints.

## Runtime trace

```text
CLI scan/sync
  -> routeSyncCliUpstreamCompositionFactory
  -> routeSyncCliManifestScanOperationFactory
  -> controllerInvocationManifestCompositionAuthority
  -> source discovery + source identity binding
  -> PHP frontend AST adapter
  -> source invocation semantic pipeline
  -> canonical source/route ADTs
  -> evidence inventories + resolution ledgers
  -> semantic reasoning / proof verification
  -> inventory closure
  -> manifestBuilderOperationPreparation.prepare(input).build()
  -> RouteSyncManifest
  -> routeSyncManifestFlowProjection.project(manifest)

Authority-backed RouteManifest path:
  -> routeManifestProjectionOperations.project(preflight, pipeline)
  -> authorityBackedRouteManifestProjectionFactory.create(pipeline)
  -> authorityBackedRouteManifestTypeLoweringFactory.create(pipeline)
  -> semantic operation preparation + judgment
  -> projected | not_projectable
  -> routeManifestProjectionCompositionFactory.create(pipeline)
  -> integratedRouteManifestAuthorityFactory.create(pipeline)
  -> integrated_manifest | manifest_derivation_blocked
```

The second path is an authority-backed RouteManifest projection path and is not a claim that every default CLI scan/sync path necessarily invokes it. The CLI manifest scanner remains a separate operation boundary.

## Changes

- Added `RouteManifestProjectionOperationsInterface` and `routeManifestProjectionOperations`.
- Replaced the loose `createAuthorityBackedRouteManifestProjection` export with `authorityBackedRouteManifestProjectionFactory.create(...)`.
- Replaced the loose `createAuthorityBackedRouteManifestTypeLowering` export with `authorityBackedRouteManifestTypeLoweringFactory.create(...)`.
- Replaced the loose `createIntegratedRouteManifestAuthority` export with `integratedRouteManifestAuthorityFactory.create(...)`.
- Updated composition consumers and the public core entrypoint to expose the typed operation objects.
- Added `audit:phase2750-upstream-cli-manifest-interface-operations`.

## Invariants

- The semantic pipeline remains a required injected dependency.
- `not_projectable` and `manifest_derivation_blocked` remain explicit outcomes; no legacy inference fallback is introduced.
- ADT variants and source evidence / resolution ledgers are preserved.
- `Object.freeze` freezes the operation object surface; it does not recursively deep-freeze referenced dependencies.
- This phase does not claim full removal of every exported function in the repository. It migrates the selected live manifest projection/factory boundaries, not unrelated helpers or code-generation functions.

## Verification

Static source audit is provided by `npm run audit:phase2750-upstream-cli-manifest-interface-operations`. Full TypeScript typecheck, unit tests, package build, and CLI end-to-end tests must still be run in an environment with dependencies installed. Existing upstream semantic proof incompleteness and the transitive `semantic/relations` dependency identified by Phase 2615 remain separate blockers and are not concealed by this interface migration.

## Official references

- TypeScript interfaces: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript object types: https://www.typescriptlang.org/docs/handbook/2/objects.html
- Laravel routing and middleware: https://laravel.com/framework/docs/routing
