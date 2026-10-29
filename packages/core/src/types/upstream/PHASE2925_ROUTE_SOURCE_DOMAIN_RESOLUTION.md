# Phase2925 — Route Source Domain Resolution

## Root cause

`routeDeclarationComposition` previously constructed default route inventory directly with `path.join`, `createSourceFile`, `empty`, repeated `include`, and indexed route-name constants. The scanner composition layer therefore knew Laravel's default route-file layout.

## Change

The existing `LaravelRouteSourceSelectionInterface` now owns `resolveFilesFor(sourceProject, intent)`. Its runtime authority resolves default Laravel route files and preserves explicit inventory unchanged. `routeDeclarationComposition` delegates to this operation. No new generic collection abstraction was introduced, and `collections.ts` remains empty.

## Runtime trace

`CLI scan/sync -> manifest composition -> LaravelRouteDeclarationCompositionAuthority.resolveSourceFiles -> LaravelRouteSourceSelectionAuthority.resolveFilesFor -> SourceFileInventory -> source observation -> route scan judgment -> manifest composition -> CLI projection`.

## Remaining design boundary

Each selection-intent variant now owns `resolveFilesFor(sourceProject)`. The default variant builds the named Laravel default route inventory; the explicit variant returns the already-selected inventory. Composition invokes the ADT operation directly and does not dispatch on the discriminant. Intent construction sites use `defaultIntent()` and `explicitIntent(...)` rather than raw tagged literals.

## Validation

The Phase2925 structural audit checks ownership of default path resolution, explicit-inventory preservation, interface-first export style, absence of route-path construction in composition, and empty `collections.ts`. It is not a substitute for full typecheck, build, unit tests, or CLI E2E.
