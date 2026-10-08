# Phase 81 — Upstream inline/free-data elimination

Laravel 13 documentation was checked before this phase. Resource routing semantics such as `only`, `except`, `names`, `parameters`, `withTrashed`, shallow/scoped nesting, singleton resources, and resource middleware are documented by Laravel.

This phase is specifically a data-shape cleanup, not a new Laravel feature implementation.

## Changes

- `RouteResourceNamesFact` now contains named `RouteResourceNameOverrideFact[]` entries instead of an inline object array.
- `RouteResourceParametersFact` now contains named `RouteResourceParameterOverrideFact[]` entries instead of an inline object array.
- `routeConstraintAstAdapter` derives its adapter input type directly from `RouteDeclarationAst['routeConstraints'][number]`; it no longer recreates an unbranded structural object type.
- `RouteBindingWithTrashed` is now a named semantic ADT and is reused by both binding contracts and resolved binding contracts.
- `RouteMethod` no longer contains `apiResource`: `apiResource` is a Laravel resource registration kind, not an HTTP method. It is represented by `RouteResourceContract.routeSet` upstream.
- Direct semantic resource tests were migrated to typed fact constructors so tests do not reintroduce free strings.

## Boundary

```text
Laravel syntax
  -> AST
  -> typed syntax facts
  -> Laravel semantic ADT
  -> RouteSemanticFlow
  -> dumb consumer flow
```

The semantic resolvers remain AST-free.

## Laravel reference

Official Laravel 13 Controllers documentation: resource action selection, naming, parameter naming, scoping, shallow nesting, singleton resources, and resource middleware.
