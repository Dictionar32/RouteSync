# Phase 213 — Knowledge/Data-Flow Beyond Tree-sitter and Syntax Control Flow

## Goal

RouteSync's semantic source of truth must not be a Tree-sitter model, a PHP AST model, or a control-flow encoding disguised as a lookup. Syntax is evidence. Semantic meaning is typed knowledge. Data-flow relations connect that knowledge. Interpreters consume the resulting model.

## External trace

- MLIR defines an IR intended to represent, analyze, and transform high-level data-flow graphs, and its data-flow framework propagates facts across control-flow constructs.
- Clang describes data-flow analysis as proving facts and propagating them through CFG edges until a fixpoint; control flow is an analysis substrate, not the semantic fact itself.
- CodeQL explicitly distinguishes the AST from its data-flow graph: data-flow nodes model semantic elements that carry values, and some AST constructs such as `if` have no corresponding data-flow node.
- CodeQL also separates local and global data flow and models call/return and field read/write propagation as reusable graph relations.
- Soufflé demonstrates a declarative fact/rule model where relations are the program representation for static analysis.

## RouteSync consequence

### Do not encode ontology as syntax

Bad ontology:

```text
if_statement
switch_statement
while_statement
foreach_statement
for_statement
```

These are evidence shapes. They are not the semantic ontology.

Canonical ontology:

```text
SemanticChoice
  kind: conditional | multiway | coalescing | pattern

SemanticRepetition
  kind: condition | iteration | counted

SemanticPredicate
SemanticMatch
SemanticOutcome
SemanticBinding
SemanticAssignment
SemanticInvocation
SemanticAccess
SemanticExceptionBoundary
```

The producer may recognize `if`, `switch`, `match`, `while`, `for`, or `foreach`, but it emits the semantic kind. A consumer does not need to know which syntax construct produced it.

## Evidence providers

`SemanticEvidenceProviderCode` now includes:

```text
parser
lexer
language_service
framework_model
reflection
inference
compiler_ir
runtime_metadata
```

This is deliberately broader than Tree-sitter. A future producer can obtain the same semantic facts from a parser, compiler IR, Laravel/framework metadata, reflection, a language service, or inference without changing the semantic model.

## Data-flow rule

```text
evidence
  ↓
semantic facts
  ↓
canonical data-flow facts
  ↓
derived indexes / Maps
  ↓
interpreter / solver
```

A `Map` or `Set` may accelerate lookup or validation. It is not the semantic source of truth.

A `while` loop may remain inside a fixpoint solver. Removing it would only change the mechanics. The important invariant is that the information being propagated is represented as typed facts/relations rather than hidden in the loop's control structure.

## New invariant

A semantic consumer should be able to operate on `SemanticKnowledgeDataFlow` without importing PHP AST types or depending on Tree-sitter node names.

The PHP AST adapter therefore remains an evidence adapter. Its provider provenance is configurable, so the semantic model is not hard-coded to parser evidence.

## Practical audit rule

When encountering `if`, `switch`, `===`, `!==`, `while`, `.includes()`, `.startsWith()`, `.endsWith()`, or `Map`/`Set`, classify the occurrence first:

1. **Domain knowledge** — elevate to typed vocabulary/fact/relation.
2. **Evidence discrimination** — keep in the adapter.
3. **Interpreter/solver mechanics** — keep the control flow.
4. **Derived index** — keep the Map/Set but make its derivation explicit.

The goal is therefore not zero control flow. The goal is zero *hidden domain knowledge* in control flow.
