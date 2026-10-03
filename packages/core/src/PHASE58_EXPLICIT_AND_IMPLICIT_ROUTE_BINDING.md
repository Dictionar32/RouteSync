# Phase 58 — Explicit + Implicit Route Binding Resolution

Laravel route binding has two distinct semantic sources. Explicit bindings may be registered with `Route::model` or `Route::bind`; implicit model binding is inferred from a route parameter matching a controller/callback parameter whose type is an Eloquent model.

The upstream resolver now accepts both facts. Explicit binding wins for the same route parameter; implicit binding is only the fallback when no explicit binding exists.

`RouteAst` remains an upstream construction artifact. `RouteSyncManifestFlow` remains AST-free.
