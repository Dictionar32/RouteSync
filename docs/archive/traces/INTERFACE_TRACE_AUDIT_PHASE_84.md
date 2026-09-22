# Interface Trace Audit Phase 84

## Finding
Phase 83 introduced semantic names and recursive array keys, but PHP operators and cast types were still primitive string unions. They represented closed syntax but did not use the same discriminated-ADT shape as the rest of the AST vocabulary.

## Repair
- PhpBinaryOperator is now a discriminated union.
- PhpUnaryOperator is now a discriminated union.
- PhpCastType is now a discriminated union.
- ArrayKey remains an explicit ADT with recursive PhpAstNode payload.
- No parser, factory, lowerer, or consumer flow was migrated.

## Invariant
Every closed syntactic operator/type at the AST boundary carries its role through a discriminant. Downstream code can pattern-match the AST vocabulary without treating arbitrary strings as syntax.
