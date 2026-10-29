# Phase 2767 — Simple generic helpers, explicit runtime operation object

## Adjustment

The `Sequence<T>` traversal and `SourceDiscovery<T>` projection are generic implementation helpers, not standalone runtime operation objects. They are now local generic arrow constants (`sequenceToArray` and `discoveredMany`) with explicit generic input/output types. Their dedicated interfaces, discriminant tags, `Object.freeze` wrappers, and `.toArray()` / `.project()` indirection have been removed.

The cohesive runtime AST projection remains the explicit object contract:

- `export interface RouteManifestAstProjectionOperationsInterface`
- `export const routeManifestAstProjectionOperations: RouteManifestAstProjectionOperationsInterface = Object.freeze({...})`

This keeps the requested `const name: InterfaceName = { ... }` style where the runtime operation is a meaningful cohesive object, without creating interfaces for tiny generic helpers.

## Runtime path

`routeSyncManifestLoweringOperations.lower` → `routeManifestAstProjectionOperations` → local `discoveredMany` / `sequenceToArray` helpers → lowered `RouteManifest`.

## Audit

Run `npm run audit:phase2767-simple-generic-helpers`. This is a TypeScript AST/syntax and structural audit for the focused file; it is not a full repository typecheck, test suite, package build, or CLI end-to-end verification.
