# Phase 215 — Semantic Data-Flow Analysis Beyond Syntax and CFG

## Principle

RouteSync treats parser/lexer/compiler IR/runtime metadata as evidence providers, not semantic authorities.
Semantic knowledge is represented as typed facts and canonical data-flow relations. Control flow is an execution/solver mechanism that may consume those facts, but it is not the source of domain meaning.

## External trace

The design was compared with several established analysis systems:

- CodeQL explicitly separates AST nodes from data-flow nodes. `if` statements are control-flow constructs and do not themselves carry runtime values; data-flow nodes represent semantic value-bearing elements. Its shared global-flow library also models call/return and field-write/read propagation on top of a language-specific graph.
- MLIR describes forward data-flow as propagation of information through different control-flow constructs, including regions and call graphs.
- SootUp separates Jimple IR, class hierarchy/call-graph construction, and interprocedural data-flow analysis.
- WALA uses SSA-based IR, call graphs, pointer analysis, and iterative/interprocedural data-flow infrastructure.

The implication for RouteSync is that the semantic layer should be a graph of facts/flows rather than an AST-shaped control-flow representation.

## What Phase 215 adds

`semanticDataFlowAnalyzer.ts` computes a **derived semantic data-flow closure** from `SemanticKnowledgeDataFlow.dataFlow`.

It does not construct a CFG and does not inspect syntax constructs such as `if`, `switch`, `while`, or `foreach`.

A derived path contains:

- source knowledge identity;
- target knowledge identity;
- the canonical data-flow facts traversed;
- accumulated semantic guards.

A guard is preserved as data:

```text
predicate
   |
   v
FlowGuard(satisfied)
   |
   v
value -> target
```

If another value-flow continues from `target`, the guard remains attached to the derived path. This makes path-sensitive reasoning possible without turning a CFG edge into the semantic source of truth.

## Map/Set rule

The analyzer uses `Map` and `Set` only as worklist/lookup/deduplication indexes. They are derived operational structures. The canonical source remains:

```text
SemanticKnowledgeDataFlow.dataFlow
```

## Direction

The next semantic extensions should be expressed as relations/facts for:

1. def → use;
2. assignment → value;
3. invocation → argument/receiver;
4. invocation → return/emission;
5. property write → property read;
6. binding → availability;
7. exception emission → handler;
8. merge → selected value;
9. interprocedural propagation through a call graph;
10. fixpoint propagation across these relations.

These are data-flow concerns. Their source syntax may be `if`, `switch`, loops, calls, assignments, or framework constructs, but those syntactic forms should not become the semantic ontology.
