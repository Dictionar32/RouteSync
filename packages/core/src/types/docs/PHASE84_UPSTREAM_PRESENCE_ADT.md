# Phase 84 — Upstream Presence ADT / No Semantic Undefined

## Laravel basis

Laravel 13 resource routing exposes explicit resource registration behavior (`resource`, `apiResource`, singleton variants), resource action selection, scoped/shallow binding, `withTrashed`, and resource middleware. Routing groups merge middleware and `where` constraints. These are semantic facts and must be resolved before the downstream flow.

## Boundary rule

```text
Laravel syntax
  -> AST / AAT
  -> typed syntax facts
  -> Presence ADT / semantic resolver
  -> semantic interface
  -> dumb flow
```

Absence is represented explicitly in upstream facts and contracts:

```ts
Presence<T> =
  | { kind: 'absent' }
  | { kind: 'present'; value: T }
```

No semantic fact uses `T | undefined` or `T | null`.

## Data-loss prevention

- No semantic ternary manufactures a fallback value from missing data.
- No `?? []` fallback is used to manufacture an empty semantic collection.
- Resource nesting no longer uses `filter(Boolean)`, so source segments are not silently discarded.
- `whereIn()` preserves enum `::cases()` as an enum semantic value.
- Binding resolution uses discriminated target ADTs instead of `model?:` / `enum?:` fields.
- AST/parser optionality remains at the syntax boundary only; it is converted to explicit `Presence` before entering upstream semantic facts.

## Validation

- `types/upstream` optional/null field scan: PASS.
- Semantic resolver AST-import scan: PASS.
- Semantic resolver no `=== undefined/null`: PASS except syntax adapter conversion helpers.
- ZIP integrity: PASS.
- Full TypeScript workspace compilation is not claimed because the supplied compact baseline does not contain all workspace dependencies.
