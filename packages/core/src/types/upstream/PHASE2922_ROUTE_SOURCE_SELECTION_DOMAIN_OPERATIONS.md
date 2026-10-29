# Phase2922 — Route Source Selection Domain Operations

## Scope

This phase continues the Phase2920 source-collection trace and targets the explicit route-source selection contract. It does not mechanically replace every `SourceFile[]` in the repository.

## Runtime trace

1. CLI `scan.ts` / `sync.ts` create a `SourceFile` for the explicit `--input` path.
2. `laravelRouteSourceSelectionAuthority.explicitFiles(...)` closes the selected file evidence in an explicit selection ADT.
3. The manifest input wraps that selection in `laravel_route_source_selection_explicit`.
4. The route scanner passes the intent to `routeDeclarationCompositionAuthority.resolveSourceFiles(...)`.
5. The explicit selection's `visitFiles(...)` operation exposes selected files in their original order; the consumer no longer reads `intent.selection.files` directly.
6. The scanner observes selected/missing files. Missing explicitly selected files remain a blocked route-scan outcome; default project discovery remains distinct.
7. The resulting route scan is consumed by the upstream manifest composition path.

## Contract change

`ExplicitRouteSourceSelectionOperations` adds a domain-owned `visitFiles(visitor)` operation to the explicit-selection variant. The operation is deliberately not generic and does not return a caller-chosen result type. The authority remains interface-first:

`export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object.freeze({...})`.

The visitor contracts are explicitly exported through `packages/core/src/index.ts`.

## Important limits

- The explicit selection still stores `readonly SourceFile[]` as its evidence representation. This phase removes direct consumer access, but does not yet replace that representation with `SourceFileInventory`.
- `resolveSourceFiles` still distinguishes default vs explicit intent using a `switch`, and `observeSourceFiles` still checks whether explicit files are missing. Those decisions have not been eliminated from the upstream authority.
- Other upstream contracts still contain `SourceFile[]`; they need separate producer/consumer traces and domain-specific decisions before changing.
- Full typecheck, build, Vitest, and CLI E2E are not claimed as passing.


## Phase2923 superseding change

The explicit selection no longer stores `readonly SourceFile[]`. It now owns a `SourceFileInventory` and delegates traversal through `inventory.visitSources(...)`. CLI scan/sync construct one-file inventories with `sourceFileInventoryFactory.empty().include(createSourceFile(...))`. The distinction between project-default selection and explicit selection remains in the outer intent ADT. This change removes the raw array representation from the explicit selection contract without replacing the distinct selection intent.
