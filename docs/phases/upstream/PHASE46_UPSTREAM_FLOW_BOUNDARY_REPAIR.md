# Phase 46 — Upstream Flow Boundary Repair

## Goal

Raise the AST/ADT intelligence upstream while keeping the downstream flow intentionally dumb.

## Boundary rule

The concrete `RouteSyncManifest` owns `CompleteSourceAst` and remains an upstream construction artifact.

The downstream-facing `UpstreamBoundary` exposes only `RouteSyncManifestFlow`:

```text
source
  -> AST / ADT
  -> CompleteSourceAst
  -> CompleteLaravelSourceModel
  -> RouteSyncManifest
  -> RouteSyncManifestFlow
  -> downstream consumer
```

A consumer cannot obtain `.ast` through `UpstreamBoundary` anymore.

## Laravel alignment

Laravel resolves controller dependencies through the service container. Interface dependencies require a binding, while contextual attributes provide contextual resolution. Route/model binding is a separate routing mechanism. Therefore controller dependency resolution belongs upstream as semantic ADT data, while the downstream flow should receive only the resolved contract.

## Regression invariant

- `RouteSyncManifest` extends `RouteSyncManifestFlow`.
- `RouteSyncManifestFlow` has no `ast` member.
- `UpstreamBoundary` has no concrete `manifest` member.
- `UpstreamManifestConstructionBoundary` is the explicit construction-side owner of the concrete manifest.
- `ControllerDependencyResolution` carries contextual attributes as semantic ADTs.
