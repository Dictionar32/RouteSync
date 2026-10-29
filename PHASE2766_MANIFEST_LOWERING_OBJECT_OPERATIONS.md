# Phase 2766 — Manifest Lowering Object Operations

## Goal

Continue the fully typed AST/ADT runtime migration across the downstream lowering boundary used after the upstream CLI manifest is built. Replace anonymous helper arrows with named, interface-typed, frozen operation objects and preserve the existing domain values and public lowering contract.

## Runtime changes

- `sequenceToArrayOperation` owns traversal of the recursive `Sequence<T>` ADT. The generic `toArray` method declares its input and readonly-array output.
- `discoveredManyOperation` interprets `SourceDiscovery<T>` through its existing `matchSourceDiscovery` and `matchDiscovered` eliminators. `notScanned`, `empty`, and `many` remain distinct cases; the operation does not collapse them into an invented success judgment.
- `routeManifestAstProjectionOperations` provides typed `routeFlows`, `models`, `resources`, and `channels` projections from a completed `RouteSyncManifest`.
- `routeSyncManifestLoweringOperations.lower` now delegates to these named operations instead of local free-standing helper arrows.
- All three operation values have explicit `kind` tags and are frozen with `Object.freeze`.
- The upstream manifest builder still distinguishes AST failure from source-model failure using separate blocker ADT variants.

## Example usage

```ts
const models = routeManifestAstProjectionOperations.models(manifest);
const channels = routeManifestAstProjectionOperations.channels(manifest);
const routes = routeManifestAstProjectionOperations.routeFlows(manifest);
```

The public lowering call remains `routeSyncManifestLoweringOperations.lower(manifest, baseURL, version, projection)`; the migration changes the internal operation boundary without inventing a parallel manifest format.

## Trace

CLI invocation-manifest composition → scanner operation → upstream manifest builder preparation → source AST pipeline → complete source-model builder → manifest ADT → lowering operations → downstream `RouteManifest`.

## Audit

Run:

```sh
npm run audit:phase2766-manifest-lowering-object-operations
```

The audit verifies AST syntax, explicit operation interfaces and tags, typed method parameters/outputs, replacement of old helper names, retained builder ADT blocker cases, and wiring to the upstream scanner.

## Verification boundary

The Phase 2766 structural audit passes 8/8 assertions with zero syntax diagnostics in the three targeted runtime files. Relevant Phase 2750, 2751, 2753, 2763, 2764, and 2765 structural audits also pass. This does not assert a full semantic TypeScript typecheck, full unit suite, package build, or CLI end-to-end test; those remain separate checks requiring the complete project dependency environment.
