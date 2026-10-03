# Phase 668 — AST Interface Highest Closure

Phase 668 raises the semantic authority frontier rather than merely repairing syntax.

## Closed interface upgrades

- `relationVariant` provides discriminant-based relational refinement without `as Extract` at the new semantic boundary.
- `Presence<T>` becomes the canonical explicit absence ADT for the migrated presence API.
- `fromOptional`, `mapOptional`, and `flatMapPresence` are removed from the production presence surface; `presenceOf`, `mapPresenceValue`, and `bindPresence` are the new algebra.
- `RouteDomainResolver` now consumes a closed `RelationOption` context instead of optional resolver fields.
- Boundary construction feeds the resolver with explicit relation options.
- Lexical `TokenEvidence` remains the scanner-side evidence interface and feeds the higher AST stage interface.

## Semantic authority

```text
source evidence
  -> TokenEvidence ADT
  -> closed AST ADT
  -> upstream relation interface
  -> resolver-domain relation interface
  -> analysis/control closure
  -> semantic type lowering
  -> target projection
```

The host language is no longer the semantic source of absence at the migrated boundaries.

## Research direction

The architecture is intentionally converging on several established compiler/verification ideas: MLIR interfaces and dialect conversion separate generic analysis/transformation from concrete operations and use rewrite patterns plus conversion legality; K makes executable semantics rewrite-based; Soufflé expresses facts and Horn rules as typed relations and computes a fixed point; circular/reference attribute grammars express recursive semantic equations with fixed-point evaluation; WebAssembly WIT makes interfaces and worlds explicit contracts. These are architectural analogies, not claims that RouteSync implements those systems wholesale.
