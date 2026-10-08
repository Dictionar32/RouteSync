# Phase 88 — Semantic model without positional lookup

The upstream Laravel semantic model no longer resolves binding identity through array indexes.

## Model

- Action parameters are keyed by `RouteParameterName` value.
- Models are keyed by `ClassName` value.
- Enums are keyed by `ClassName` value.
- Nested implicit-model scoping is represented by the presence of the previously resolved model, not an ordinal/index.
- `Enum::cases()` parsing preserves the expression as a semantic enum name without regex capture indexes.

## Boundary

```text
AST
  -> typed facts
  -> semantic catalog / ADT
  -> Laravel semantic resolver
  -> RouteSemanticFlow
```

The resolver does not infer meaning from position `0`, `1`, `2`, `findIndex()`, or numeric array lookup.
No descriptor layer is introduced.
