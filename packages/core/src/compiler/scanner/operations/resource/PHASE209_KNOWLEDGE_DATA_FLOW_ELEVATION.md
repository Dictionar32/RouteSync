# Phase 209 — Resource Knowledge/Data-Flow Elevation

## Principle

RouteSync treats semantic knowledge as typed data. Control flow may interpret that
knowledge, but must not become the source of semantic truth.

This phase applies that rule to Resource -> Model resolution.

## Before

`twoPassRelationResolver` stored relation propagation in:

```ts
Map<ResourceName, ModelName>
```

The map therefore mixed two concerns:

1. the semantic fact `Resource -> Model`;
2. the lookup representation used to retrieve that fact.

That made a lookup structure act as an ontology.

## After

The canonical representation is:

```text
ResourceRelationKnowledgeFact[]
ResourceModelResolutionFact[]
        │
        ▼
ResourceModelKnowledgeDataFlow
        │
        ▼
derived Map<ResourceName, ModelName>
```

The Map is now explicitly a derived index.

### Resolution origins

A `ResourceModelResolutionFact` records whether the knowledge came from:

- `controller_dataflow`
- `convention`
- `relation_propagation`

Relation propagation additionally records the relation that produced the model.

## Control-flow rule

The fixpoint `while` remains because it is solver mechanics. It no longer stores
semantic truth in a Map. Each iteration interprets existing facts and emits new
resolution facts.

Likewise, a parser/syntax branch such as `apiResource` is first classified into
the typed `RouteDeclarationSemanticKind` data-flow vocabulary. The route scanner
then dispatches from that semantic classification rather than treating the raw
syntax spelling as its semantic source of truth.

## Boundary

Tree-sitter/parser evidence remains an input boundary. The semantic boundary is
above syntax:

```text
syntax evidence
    ↓
typed fact
    ↓
knowledge / relation
    ↓
data-flow
    ↓
interpreter / derived index
```

This is intentionally consistent with compiler IR practice: an IR is an internal
data structure used for analysis and transformation, while control flow can be
represented and interpreted separately from the semantic data it carries.
