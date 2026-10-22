# Phase 1478 — Shared PHP Type Atom Authority

## Trace finding

`phpParameterTypeAlgebra` and `phpTypeExpressionAlgebra` each encoded PHP primitive meaning independently. In particular, parameter evidence mapped `array` to `primitive/unspecified`, while property type expressions mapped `array` to `primitive/json`. The same source-language atom therefore had two semantic meanings depending on which scanner path produced it.

## Change

- `phpParameterTypeAlgebra` delegates primitive atoms to `phpTypeExpressionAlgebra`.
- The parameter algebra retains responsibility for parameter-specific evidence: named class references and nullable structure.
- Runtime scanner mapping remains an adapter from `PhpParameterTypeAst` to typed evidence, then projects the shared judgment to `TypeExpression` or a closed error expression.
- Regression coverage asserts equality of judgments for `string`, `int`, `float`, `bool`, `mixed`, and `array` across both source paths.

## Boundary

This does not claim the parameter AST supports PHP union/intersection/DNF types. Those remain an explicit AST vocabulary and evidence coverage gap, not a runtime fallback. Build and Vitest must be run in an environment with package dependencies installed.
