# Phase 334 — Relational Cursor Witness Navigation

## Objective

Raise parser navigation one semantic level above sentinel-based cursor APIs.

The new boundary is:

```text
cursor position
    -> CursorPresence witness
    -> RelationOption witness
    -> syntax relation
    -> semantic candidate / requirement
```

## Changes

- `tokenCursor.ts`
  - exports `CursorPresence<T>` as the transitional syntax witness domain;
  - exposes `currentPresence`, `previousPresence`, `nextPresence`, `afterNextPresence`, and `terminalPresence`.
- `syntaxCursorWitness.ts`
  - introduces the canonical `CursorWitness<T> = RelationOption<T>` boundary;
  - converts cursor presence into relation witnesses;
  - exposes token witnesses and a token-value witness.
- `syntaxNavigation.ts`
  - relation map now uses `RelationOption` witnesses instead of nullable/sentinel values;
  - navigation lookup is relation-driven;
  - search results are witnesses;
  - array element navigation derives from span relations rather than sentinel indexing.

## Architectural rule

`undefined` remains only inside the transitional legacy `TokenCursor` implementation. It is
not exposed by the new semantic navigation boundary. Removing those legacy getters is a later
migration step after all parser consumers have moved to `CursorWitness`.

This avoids the known failure mode where a blind sentinel replacement changes parser continuation
semantics. The migration is therefore monotonic: introduce witness relations, migrate consumers,
then remove legacy APIs.

## Research alignment

The design follows three complementary ideas:

1. Souffle-style typed relations and rules for semantic facts.
2. MLIR PDL/PDLL-style explicit matcher/rewrite boundaries.
3. JastAdd-style circular fixed-point evaluation for recursive semantic closure.

RouteSync adds an explicit witness domain so parser absence cannot be confused with semantic data.
