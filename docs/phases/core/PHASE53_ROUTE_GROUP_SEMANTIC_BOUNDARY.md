# Phase 53 — Route Group Semantic Boundary

Laravel route groups can share middleware, URI prefixes, controller targets,
subdomains, name prefixes, and binding behavior. Nested groups merge middleware
and `where` constraints while prefixes and names are appended.

Phase 53 moves the interpretation of the currently scanned group facts out of
`RouteScanner` into `routeGroupContextResolver.ts`.

The intended boundary is:

`RouteDeclarationAst -> resolveRouteGroupContext() -> RouteGroupContext -> RouteProducer -> RouteDefinition -> RouteAst -> CompleteSourceAst -> RouteSyncManifestFlow`

`RouteAst` remains intact. It is still the upstream construction artifact and
retains the original `RouteDeclarationAst` for provenance/syntax traceability.

The semantic producer remains AST-free: it consumes `RouteProducerInput` only.
