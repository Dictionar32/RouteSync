# Phase 970 — Manifest Dataflow Closure

Phase 970 closes the remaining manifest-level dataflow migration gap.

## Production boundary

`semanticDataflowInputsFromSourceModel()` is the single upstream seed assembly surface for the manifest. `constructRouteSyncManifest()` materializes `dataflowInputs` once, and `scanRouteSyncManifestFlow()` forwards the same value without rebuilding it.

`analyzeRouteSyncManifestDataflow()` now consumes only the controller-scoped `manifest.dataflowInputs`. If a controller action has no canonical manifest input, production analysis fails explicitly instead of falling back to `controller.semantic.dataflow`. This removes the last dual-input path at the manifest boundary.

## Route projection

`semanticDataflowRouteParameterFacts()` remains seed-only and emits `SemanticDataflowInputFact` values. It reuses the existing `RouteParameter['binding']` contract for proven implicit, explicit, and custom model bindings; no second route-binding ADT is introduced.

## Authority

No solver, reachability closure, path derivation, or `SemanticDataflowInterface` construction was added to manifest/projection surfaces. `semanticDataflowAuthority.ts` remains the sole semantic dataflow judgment authority.

## Laravel correspondence

The route binding projection follows Laravel’s documented distinction between implicit model binding, explicit `Route::model`, and custom `Route::bind`. The ecommerce fixture currently demonstrates scalar route parameters rather than actual model-binding DSL, so no implicit Eloquent model binding is inferred from those routes.

## Validation

- `audit-phase964-upstream-dataflow-interface.cjs`: clean
- `audit-phase965-route-parameter-dataflow.cjs`: clean after migration-aware assertion update
- `audit-phase966-controller-dataflow-interface.cjs`: clean after migration-aware assertion update
- `audit-phase970-manifest-dataflow-closure.cjs`: clean
- TypeScript compile attempt: blocked before source checking because the workspace has no installed `@types/node` and `vitest/globals` type definitions.
