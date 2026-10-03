# Phase 172 — All Operator Applications Are Knowledge

## Finding

`===` / `!==` were already represented by `SemanticComparison`, but other binary
operators such as `+`, `-`, `&&`, `||`, `|`, and string concatenation could fall
back to a generic `SemanticValue`. That lost semantic structure and made the
model asymmetric: only comparisons were first-class operator applications.

## Change

Every binary operator application is now a typed fact:

- `SemanticComparison` for comparison operators.
- `SemanticBinaryOperation` for arithmetic, logical, bitwise, and string operators.
- Both retain a typed operator fact and typed operand KnowledgeIds.
- Data-flow relations describe operand/operator dependencies only.

Therefore `===`, `!==`, `+`, `&&`, etc. are all knowledge, while their
relationships are data-flow. No operator application requires a control-flow
edge to recover its meaning.

## Principle

> Raise semantic knowledge into typed data. Do not recover meaning by walking a
> control-flow graph or by treating a generic value edge as an implicit AST.

Tree-sitter remains syntax evidence; the semantic model is the source of truth.
