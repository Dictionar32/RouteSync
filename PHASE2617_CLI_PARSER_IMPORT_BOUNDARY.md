# Phase 2617 — CLI Parser Import Boundary

## Root cause

`LaravelSourceLexer.ts` imported `parseRouteDeclarations` and `RouteDeclarationAst` through `./lexer/routeAst`. That path is a broad barrel which re-exports semantic-relation solvers, rewrite engines, relation plans, and other semantic tooling unrelated to parsing a route declaration. The lexer only needs the concrete parser operation and its AST type.

## Changes

- Import `parseRouteDeclarations` directly from `routeDeclarationParser.ts`.
- Import `RouteDeclarationAst` directly from `routeDeclarationAst.ts`.
- Refactor `GraphNodeIndex` to implement its existing lookup/index operations over its own entries and the upstream `Lookup` ADT, removing its direct dependency on `semantic/relations`.
- Keep the CLI host-composition path on `@routesync/core/upstream`.
- Add a structural audit for these boundaries.

## Scope and remaining work

This is a dependency-boundary correction, not a claim that the entire CLI dependency closure is free of `semantic/relations`. `routeDeclarationParser.ts` itself still uses relation helpers for syntax operations, and other imports through the broad `@routesync/core` entrypoint may independently reach relation modules. Those are subsequent upstream-owned migrations. No `semantic/foundation` dependency is introduced.

## Validation limits

The workspace has no `node_modules`, so full typecheck, package build, Vitest, and Laravel end-to-end validation were not run. Structural audit results are reported separately from those checks.
