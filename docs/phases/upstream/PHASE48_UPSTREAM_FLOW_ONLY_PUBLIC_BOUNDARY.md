# Phase 48 — Upstream AST/ADT Elevation: Flow-Only Public Boundary

The public scanner boundary now exposes only `RouteSyncManifestFlow`.

## Invariant

```text
Laravel source
  -> AST
  -> CompleteSourceAst
  -> semantic ADT resolution
  -> CompleteLaravelSourceModel
  -> RouteSyncManifest (construction-only)
  -> RouteSyncManifestFlow (public)
  -> downstream consumers
```

`constructRouteSyncManifest()` is module-private. A consumer cannot obtain the
concrete manifest or its AST through the scanner orchestrator.

The flow is intentionally dumb: it transports already-resolved meaning,
identity, and provenance. It does not interpret PHP syntax or Laravel AST.

## Laravel alignment

Laravel's service container resolves controller and route dependencies and
supports interface bindings and contextual attributes. Therefore dependency
interpretation belongs upstream, while downstream consumers should consume the
resolved semantic contract. Route model binding remains a separate routing
semantic and is represented upstream rather than re-derived from AST downstream.
