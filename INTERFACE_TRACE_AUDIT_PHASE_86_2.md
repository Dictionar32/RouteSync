# Interface Trace Audit — Phase 86.2

## Origin evidence: ecommerce_shop

The ecommerce_shop corpus contains real Laravel closure syntax such as:

`whereHas('order', function ($query) use ($request) { ... })`

The closure body is PHP block syntax `{ ... }`, not an expression. Phase 85 represented `ClosureAstNode.body` as a single `PhpAstNode`, which could encode only one expression and therefore erased the block boundary and statement cardinality.

## Defect

`ClosureAstNode.body: PhpAstNode` conflated:

- closure block body
- expression body used by arrow functions

This was an AST shape error. Arrow functions have an expression body; closures have a statement block.

## Repair

Added:

- `PhpBlock`
- `PhpStatement`
- `expression_statement`
- `return_statement`

`ClosureAstNode.body` now requires `PhpBlock`, while `ArrowFuncAstNode.body` remains `PhpAstNode`.

The catamorphism folds closure blocks into `readonly R[]`, preserving statement multiplicity instead of collapsing the body into one value.

## Invariant

> A PHP AST must preserve the syntactic boundary between closure statement blocks and arrow-function expressions.

The downstream consumer can now distinguish `function (...) { ... }` from `fn (...) => ...` without reparsing `originalCode`.
