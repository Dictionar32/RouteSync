# Phase 52 — Route AST retained, construction boundary elevated

RouteAst is intentionally retained. It is part of CompleteSourceAst and remains the upstream construction artifact that preserves the original Laravel route declaration together with its semantic RouteDefinition.

The semantic producer is AST-free:

Laravel route syntax -> RouteDeclarationAst -> semantic ADT (`RouteDefinition`) -> AST construction boundary -> `RouteAst` -> `CompleteSourceAst` -> `CompleteLaravelSourceModel` -> `RouteSyncManifestFlow`.

`RouteAstConstructionInput` and `RouteAstConstructor` make the construction boundary explicit. Downstream interfaces continue to receive `RouteDefinition` / `RouteSyncManifestFlow`, not the Laravel declaration AST.

This is deliberately not an AST deletion. It is an AST ownership correction: syntax interpretation happens upstream, semantic meaning is carried by ADT, and AST wrapping is confined to the upstream construction boundary.
