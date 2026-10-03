# Phase 89 — Semantic Knowledge Model

Laravel knowledge is materialized upstream as data. The resource resolver no longer uses a `switch` to interpret Laravel registration modes or action selection. Registration modes point to semantic profiles; selection points to model operations.

```text
Laravel syntax
  ↓
AST
  ↓
Typed syntax facts
  ↓
Semantic Knowledge Model
  ├─ identity
  ├─ entity
  ├─ relation
  ├─ capability / action profile
  ├─ constraint
  ├─ presence
  └─ provenance
  ↓
Existing ADT / interface
  ↓
Dumb flow
```

## Invariant

A new Laravel registration mode should add a model profile rather than another semantic branch in the flow. Ordering of catalog data must not change resolution.

Laravel 13 documents resource/API resource actions, singleton/API singleton resources, `scoped`, `shallow`, resource middleware, and `where` as distinct resource semantics. These are therefore represented upstream rather than interpreted downstream.
