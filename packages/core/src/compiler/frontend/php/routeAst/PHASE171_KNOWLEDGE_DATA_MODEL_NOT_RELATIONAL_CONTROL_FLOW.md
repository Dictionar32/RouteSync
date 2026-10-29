# Phase 171 — Knowledge structure is data; relations are data-flow

## Principle

The canonical RouteSync model must not encode semantic knowledge by inventing graph edges that merely describe syntax structure or execution routing.

Tree-sitter remains syntax evidence. Its concrete syntax tree is not the semantic ontology. Tree-sitter documents that its nodes correspond to grammar terminals/non-terminals, while semantic interpretation belongs above that representation.

## Changes

Semantic control constructs are represented as typed data:

- `SemanticDecision.branches` represents decision alternatives.
- `SemanticSelection.alternatives` represents switch/match alternatives and their conditions.
- `SemanticIteration` directly owns condition/initializer/update/iterable/target/body.
- `SemanticExceptionBoundary` directly owns try body, handlers, and finally block.
- `SemanticExceptionHandler` directly owns exception type, bound variable, and handler body.
- `SemanticTransition` directly owns return/throw meaning and its optional semantic value through `SemanticPresence`.
- `SemanticRegion.members` directly owns its semantic members.

Therefore these structures do not require `contains`, `selects`, `matches`, `satisfies`, `catches`, `executes_finally`, `returns`, `throws`, or `reenters` relations in the canonical model.

## Data-flow relations

The canonical relation vocabulary is intentionally limited to relationships that describe semantic dependency or movement of information:

- `depends_on`
- `derived_from`
- `produces`
- `consumes`
- `transforms`
- `assigns`

These relations are graph data used by analyses. They are not an alternative encoding of control-flow.

This follows the useful distinction visible in MLIR: data-flow analysis tracks dependencies and propagates information across control-flow constructs rather than equating the data-flow model with control-flow itself.

## Result

The source of truth is now:

```text
Typed semantic facts
        +
explicit typed fields
        +
semantic data-flow dependencies
        ↓
Knowledge/Data-Flow Model
        ↓
derived interpretation / execution
```

Not:

```text
syntax node
  ↓
control-flow edge
  ↓
pretend the edge is knowledge
```
