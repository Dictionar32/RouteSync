# Phase2925 — Fully Typed Runtime Scanner Operations

## Scope

Fix the low-level default route source construction previously embedded in `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`.

## Runtime trace

`CLI scan/sync -> ControllerInvocationManifestComposition -> LaravelRouteDeclarationCompositionAuthority.resolveSourceFiles -> LaravelRouteSourceSelectionIntent.resolveFilesFor -> SourceFileInventory -> source observation -> route scan outcome -> manifest judgment -> CLI projection`.

## Root-cause change

- The `LaravelRouteSourceSelectionIntent` ADT now carries `resolveFilesFor(sourceProject)` as a domain operation on each variant.
- `defaultIntent()` owns the Laravel default route inventory and names `routes/api.php` and `routes/web.php` explicitly. It no longer requires indexed route-name constants at the scanner-composition layer.
- `explicitIntent(selection)` preserves and returns the already-selected `SourceFileInventory` rather than rebuilding it.
- `routeDeclarationComposition.resolveSourceFiles` delegates directly to `intent.resolveFilesFor(sourceProject)`. It no longer switches on intent kind or constructs route paths.
- CLI scan/sync and drift audit now construct selection intent through the interface-first authority instead of raw tagged object literals.
- No new generic collection abstraction was introduced. `packages/core/src/types/upstream/collections.ts` remains empty.

## Example

```ts
const routeSelection = laravelRouteSourceSelectionAuthority.explicitIntent(
  laravelRouteSourceSelectionAuthority.explicitFiles(
    sourceFileInventoryFactory.empty().include(createSourceFile(selectedRouteFile)),
  ),
);

const inventory = routeSelection.resolveFilesFor(sourceProject);
```

For default route selection, use `laravelRouteSourceSelectionAuthority.defaultIntent()`; the resulting ADT resolves its own source inventory.

## Validation

- Phase2925 source-domain audit: 11/11.
- Phase2922 route-selection audit: 11/11.
- Phase2923 inventory contract audit: 13/13.
- Phase2924 route-scanner inventory audit: 12/12.
- Total across these structural audits: 47/47.
- TypeScript transpile syntax check: 19 modified/recently touched TypeScript files, 0 syntax diagnostics.
- ZIP integrity is checked after packaging.

## Explicit limitations

These are structural and syntax checks, not a full TypeScript typecheck. Vitest, build, full unit suite, and CLI E2E remain unverified because the extracted workspace has no installed `node_modules`. The source-observation authority still owns a separate missing-file policy decision; this phase specifically removes low-level route-path construction and default/explicit intent dispatch from the scanner composition layer rather than claiming every primitive decision across the entire manifest pipeline has been eliminated.
