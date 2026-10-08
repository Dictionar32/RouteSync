# Phase 51 — Semantic Route Producer Boundary

Laravel route meaning is now produced upstream without exposing route declaration AST through the producer interface.

## Boundary

`RouteProducerInput` contains semantic route facts only. It no longer carries `RouteDeclarationAst`.

`RouteProducer.produce()` returns `RouteDefinition`, not `RouteAst`.

The construction-side `RouteScanner` is responsible for wrapping the already-produced semantic definition with the original declaration AST when the concrete `CompleteSourceAst` is assembled.

This follows the Laravel routing model: route parameters, controller target, middleware/security, route-model binding, constraints, and execution semantics are resolved into facts upstream; consumers do not interpret Laravel syntax again. Laravel documents route parameters, controller actions, middleware, and route-model binding as distinct routing semantics.

## Flow

`Laravel source -> lexer/parser AST -> semantic route resolution -> RouteDefinition -> AST construction wrapper -> CompleteSourceAst -> CompleteLaravelSourceModel -> RouteSyncManifestFlow`

The AST remains available only to the construction artifact. The interface used for semantic route production is AST-free.
