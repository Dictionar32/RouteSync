# Phase 1101 — Upstream → Wiring → Interface → Downstream

## Canonical direction

```text
Laravel source
  -> scanner/parser
  -> upstream semantic authority
  -> RouteSyncManifest
  -> downstream-owned wiring
  -> generic interface
  -> analysis / graph / IR
  -> CLI artifact emission
```

## Changes

- `DataFlowInterface` remains domain-neutral and is not implemented by upstream contracts.
- `InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional.
- Concrete semantic dataflow runtime remains in `packages/cli/src/dataflow/semanticDataflowRuntimeBoundary.ts`.
- Retired core runtime adapter/composition paths remain present but empty.
- `RouteManifestProjectionInterface` now explicitly represents the downstream projection boundary from `RouteSyncManifest`.
- `routeManifestProjection.ts` owns wiring from the completed upstream manifest into downstream `requestTypes` and `semanticTypes` artifacts.
- `routeManifestLowerer.ts` is now a materializer only: it consumes explicit projection artifacts and does not invoke `TypeDeriver` or `TypeInterner`.
- CLI `scan` and `sync` explicitly inject the projection before materialization.
- Legacy generator paths remain present and empty; no legacy path is deleted.
- `StaticLaravelScanner` has no production implementation or production reference.

## Remaining frontier

The projection wiring still reads the validated manifest AST because the existing downstream `RouteManifest` representation contains compiler-specific `RequestType` and `ObjectType` artifacts. The next clean step is to move those artifacts' canonical semantic inputs into upstream vocabulary, then make the projection consume contracts/relations rather than AST. This is intentionally not mixed into Phase 1101 because it is a larger representation migration.
