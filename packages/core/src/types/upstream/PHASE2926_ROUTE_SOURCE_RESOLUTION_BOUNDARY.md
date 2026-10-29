# Phase2926 — Route Source Resolution Boundary

## Root cause fixed

Phase2925 moved concrete Laravel default route path construction into `LaravelRouteSourceSelectionIntent.resolveFilesFor`, but the operation still owned low-level filesystem details (`path.join`, `createSourceFile`, and inventory assembly). This phase removes those details from `packages/core/src/types/upstream/laravelRouteSourceSelection.ts`.

## Contract ownership

- `LaravelRouteSourceSelectionIntent` retains domain follow-up operation `resolveFilesFor`.
- The operation receives `LaravelDefaultRouteSourceResolutionInterface`, an explicit capability for resolving the conventional Laravel source layout.
- The default intent delegates to that capability.
- The explicit intent returns its already-constructed `SourceFileInventory` unchanged.
- `laravelDefaultRouteSourceResolution` is the filesystem adapter that owns concrete route filenames, path joining, `SourceFile` construction, and inventory assembly.
- `routeDeclarationCompositionAuthority.resolveSourceFiles` supplies the adapter when following the ADT operation.

## Runtime trace

`CLI scan/sync/drift audit -> manifest composition -> LaravelRouteScanner.prepare -> routeDeclarationCompositionAuthority.resolveSourceFiles -> intent.resolveFilesFor(sourceProject, laravelDefaultRouteSourceResolution) -> SourceFileInventory -> source observation -> scan judgment -> manifest judgment -> CLI projection`.

## Constraints retained

- Runtime exports use `export const name: Interface = Object.freeze({...})`.
- No `export function` declaration was introduced in the modified runtime modules.
- No generic collection abstraction was added.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Validation boundary

The Phase2926 structural audit validates ownership and wiring. It does not establish full TypeScript typecheck, build, full unit-test, or CLI E2E success.
