# Phase 49 — Upstream construction + Laravel contextual-resolution ADT

The construction path is now owned by `compiler/scanner/upstream/upstreamManifestBuilder.ts`.
The scanner orchestrator only projects the construction artifact into
`RouteSyncManifestFlow`; it does not own AST validation or semantic-model
construction.

Laravel's documented service-container contextual attributes are represented
as upstream ADT facts. `RouteParameter` remains a contextual dependency fact,
while route-model binding remains a separate routing concern and is not
collapsed into container dependency resolution.

Public downstream flow remains AST-free.
