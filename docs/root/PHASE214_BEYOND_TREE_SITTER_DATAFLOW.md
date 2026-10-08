# Phase 214 — Beyond Tree-sitter: Guarded Semantic Data-Flow

## Principle

Knowledge must become typed data before interpretation. Syntax/control-flow constructs are evidence or execution mechanics; they are not the semantic source of truth.

## Research basis

- Tree-sitter produces a concrete syntax tree. Its nodes are syntax evidence, not a complete semantic model.
- CodeQL separates AST from a data-flow graph. Data-flow nodes represent semantic value-carrying elements and can exist without corresponding AST nodes; `if` itself is not a data-flow node.
- MLIR provides an IR designed for high-level data-flow graphs and data-flow analyses that propagate information through control-flow constructs.
- LLVM SSA uses `phi` to model value selection/merge across predecessor paths.
- SootUp demonstrates IR + interprocedural data-flow analysis as a separate analysis layer.

## RouteSync consequence

The canonical model now supports `SemanticFlowGuard` on every dependency/value-flow fact:

```text
predicate
   ↓
SemanticFlowGuard
   ↓
value-flow / dependency
```

This means an `if` condition can become a predicate fact and its guarded data dependencies can be represented directly. The branch construct does not need to be the semantic carrier.

A syntax-neutral `SemanticMerge` fact is also available for values selected from alternatives, analogous in purpose to SSA `phi`/select but independent of a specific IR syntax.

## Evidence providers

The semantic model accepts evidence from:

- parser
- lexer
- language service
- framework model
- reflection
- inference
- compiler IR
- runtime metadata

Tree-sitter is therefore only one evidence provider, not the semantic boundary.

## Map/Set rule

Maps/Sets remain derived lookup/validation indexes. Canonical truth is the typed facts and data-flow relations.
