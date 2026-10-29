# Phase 163 — Knowledge/Data-Flow Beyond Control Flow

## Principle

RouteSync must raise meaning into typed data. `if`, `while`, `switch`, `===`, `!==`, `for`, `foreach`, `match`, ternary, `??`, assignment, access, invocation, return, and throw are syntax evidence, not the semantic source of truth.

## Source of truth

`semanticKnowledgeDataFlowRelations.ts` defines the semantic vocabulary:

- values
- operators
- comparisons
- predicates
- decisions
- outcomes
- assignments
- invocations
- accesses
- transitions
- iterations
- selections
- data-flow relations

The graph is fact-first:

```text
facts + relations
```

There is no semantic meaning in insertion order and no implicit `node[n] -> node[n+1]` edge.

## Boundary

```text
PHP syntax / Tree-sitter / parser
              |
              | evidence + provenance
              v
     typed semantic facts
              |
              v
       Knowledge Data Flow
              |
              v
          consumers
```

Tree-sitter remains a syntax/evidence substrate. It exposes syntax-tree nodes and grammar fields; it does not define RouteSync's domain semantics.

## Derived indexes

`Map` is allowed only as an index over source-of-truth facts. It must never introduce semantic knowledge that does not exist in the fact collection.

## Control-flow interpretation

Control-flow may be reconstructed from semantic facts when a consumer needs execution interpretation. It is therefore a derived interpretation of the knowledge graph, not the knowledge graph itself.

## Required invariants

1. No sequential edge may be inferred from array/node order.
2. Every data-flow edge must connect two distinct semantic fact IDs.
3. Syntax names (`if`, `while`, `switch`, `case`, `true_branch`, `repeat`) are not semantic relation names.
4. Operators are facts; operator lookup maps are derived.
5. Provenance identifies the syntax evidence that produced a fact but is not itself semantic meaning.
