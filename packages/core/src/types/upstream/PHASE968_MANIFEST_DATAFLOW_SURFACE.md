# Phase 968 — Manifest Dataflow Seed Surface

The manifest boundary now exposes controller-scoped `SemanticDataflowInput` values through `ManifestDataflowSeedSurface`.

## Boundary

`RouteSyncManifestFlow` remains AST-free and extends `ManifestDataflowSeedSurface`.
The surface contains only canonical dataflow inputs. It does not contain `reaches`, closure, derivations, or paths.

## Ownership

`semanticDataflowInputsFromSourceModel()` assembles scanner-backed controller dataflow plus the existing route-parameter, controller model/resource/response, and controller-query seed projections. The manifest builder materializes this once; the public scanner flow reuses the materialized value.

`analyzeRouteSyncManifestDataflow()` consumes `manifest.dataflowInputs` and passes each controller input to `analyzeSemanticDataflowInput()`.

The only closure authority remains `createSemanticDataflowJudgment()` in `semanticDataflowAuthority.ts`.

## Laravel boundary

The ecommerce fixture uses scalar route parameters such as `{id}`, `{produkItemId}`, and `{orderId}`. It does not provide evidence for implicit/explicit Eloquent model binding, so this phase does not invent model-binding facts. Existing upstream `RouteParameterBinding` remains the authority for future sources that actually prove implicit, explicit, custom, or enum binding.
