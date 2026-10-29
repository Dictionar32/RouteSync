# Phase2923 — Route Source Selection Inventory Contract

## Scope

Phase2923 continues the upstream source-selection trace from Phase2922. It fixes the remaining representation-level problem in the explicit selection ADT: source-file evidence was still stored as `readonly SourceFile[]` even though the selection already exposed a domain visitor.

## Trace

1. CLI `scan.ts` / `sync.ts` canonicalize the project root and resolve the selected route path.
2. Each command creates a domain inventory using `sourceFileInventoryFactory.empty().include(createSourceFile(selectedRouteFile))`.
3. `laravelRouteSourceSelectionAuthority.explicitFiles(inventory)` builds the explicit selection ADT.
4. The composition input keeps `laravel_route_source_selection_explicit` distinct from `laravel_route_source_selection_default`.
5. `routeDeclarationCompositionAuthority.resolveSourceFiles(...)` traverses the explicit selection through `visitFiles(...)`, which delegates to `SourceFileInventory.visitSources(...)`.
6. Source observation preserves the distinction between a missing explicitly selected file (blocked) and a missing optional default route file (optional absence).
7. The route scan result flows into the existing upstream manifest composition path.

## Contract change

`LaravelRouteSourceSelection` now stores `inventory: SourceFileInventory`, not `files: readonly SourceFile[]`. The factory accepts the inventory directly. The domain visitor remains non-generic and preserves inventory order. CLI producers no longer pass array literals to the selection authority.

The runtime authority remains interface-first: `export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object.freeze({...})`.

## Limits and remaining trace

- The scanner's `resolveSourceFiles(...)` boundary still returns `readonly SourceFile[]` because its downstream scan/observation contracts currently consume arrays. That is a separate contract migration and must be traced through source observation, read scheduling, and scan result construction before changing.
- Default-vs-explicit dispatch and explicit-missing-file blocking remain upstream decisions. This phase removes array storage from the selection ADT; it does not claim to eliminate all `switch`/primitive checks across the scanner.
- Other upstream contracts still contain `SourceFile[]`; this phase only addresses explicit route-source selection on the CLI route-manifest path.
- Full typecheck, build, Vitest, and CLI E2E are not claimed as passing unless separately executed.
