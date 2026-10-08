# Phase 381 — Resource Relational Authority Cutover

## Goal

Continue the semantic-authority migration after Phase 380 by removing host-language
control/absence constructs from the Resource -> Model semantic path.

## Cutover

- `ResourceModelResolver` now composes controller evidence, propagated knowledge,
  convention evidence, and structural evidence as `Presence` / `RelationOption`
  candidates and selects the first derivable witness relationally.
- `resourceDataflowAggregator` returns `RelationOption` instead of an undefined
  sentinel and uses relational expansion for extraction.
- `twoPassRelationResolver` no longer owns an imperative while/for fixed-point loop.
  Propagation is a monotone transfer evaluated by `relationLatticeFixedPoint`.
- Resource relation construction uses `relationProject` rather than Array.map.
- Model lookup absence is represented by `Presence` witnesses.

## Authority model

```text
controller facts
      \
knowledge facts -----> candidate relations ---> priority fold ---> model binding
      /                         ^
convention facts               |
structural facts         lattice fixed point
```

The fixed-point driver controls convergence; Laravel semantic meaning is represented
by facts and relations rather than host-language branching.

## Scope

Existing Phase 380 authority surfaces remain AST-clean:

- semanticRelationSolver
- syntaxErrorRelationCore
- ternaryHandler
- parserAdapterRelations
- routeBindingAstAdapter
- syntaxRange

Phase 381 extends the same gate to:

- ResourceModelResolver
- resourceDataflowAggregator
- twoPassRelationResolver
