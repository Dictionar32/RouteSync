# Phase 85 — Upstream exhaustive control and no-data-loss semantics

Laravel 13 routing/resource semantics were rechecked against the official routing and controller documentation.

## Changes

- Resource registration mode is now a discriminated ADT: `resource`, `api_resource`, `singleton`, `api_singleton`; the redundant `api: boolean` is removed.
- Binding semantic resolver receives an explicit input ADT instead of positional defaults that synthesize `default`/empty arrays.
- Resource action selection preserves requested action names instead of silently filtering unknown actions away. Concrete route expansion still uses only Laravel-supported actions.
- Resource name and parameter declarations are preserved instead of silently discarded by action/resource filters.
- Constraint `values` now uses `Presence`; missing `whereIn` values become an explicit `unresolved` matcher rather than an invented empty array or thrown-away fact.
- Missing `where` patterns likewise become an explicit `unresolved` matcher.
- Adapter coercions such as `String(value)` were removed where the AST already carries a typed syntax value, preventing accidental `"undefined"`-style data fabrication.
- Semantic/flow resolvers contain no ternary expressions and no `=== undefined/null` checks.

## Boundary

```text
Laravel syntax
  -> AST/AAT
  -> typed syntax facts
  -> semantic ADT
  -> dumb interface/flow
```

Optionality is allowed at the AST boundary because syntax may be absent. Before semantic interpretation it is represented by explicit `Presence`/discriminated ADTs.
