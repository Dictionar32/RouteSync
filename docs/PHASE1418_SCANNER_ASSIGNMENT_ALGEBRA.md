# Phase 1418 — Scanner Assignment Parts Algebra

## Boundary

`scannerAssignmentPartsAlgebra` now owns the reusable assignment decomposition algorithm: ordered operator-candidate selection, candidate range validation, target acceptance, reference-marker recognition, and the closed assignment-parts result. It accepts a generic token type and returns a typed result rather than constructing a PHP AST node.

`astClassifierRuntime` retains the PHP-specific operator vocabulary and injects token observations, top-level operator lookup, target grammar (`classifyAssignmentTarget`), expression classification (`classifyAstTokens`), and slicing. `classifyAssignmentExpression` and `classifyAssignment` remain AST/statement constructors and consume the same resolved parts.

## Why this boundary

The reusable algorithm must not know PHP AST variants. Conversely, the upstream contract should not invent PHP grammar: PHP operator spellings and valid target forms remain explicit language capabilities. This follows the interface-oriented compiler pattern where generic passes depend on declared operation capabilities, not concrete dialect implementations.

## Remaining migration frontier

- `classifyAssignmentTarget`, `classifyDestructuringTarget`, `classifyDestructuringEntry`: PHP-specific target grammar remains in runtime; next extract a declarative target-resolution contract plus a PHP rule provider, while keeping AST constructors at the edge.
- `findTopLevelOperator`, `splitTopLevel`, `matchingClose`, `matchingBrace`: reusable delimiter/top-level traversal still lives in runtime and should become a shared token-structure algebra with explicit malformed/unclosed outcomes.
- `astClassificationRules`, `simpleStatementRules`, `structuredStatementRules`: runtime still owns ordered rule catalogues and classification fallbacks. Move rule priority, applicability proofs, and exhaustive resolution into algebra; leave language-specific rule definitions as injected capabilities.
- `classifyCompoundExpression`, `classifyTernary`, binary/unary parsing: migrate operator candidate selection and precedence/associativity mechanics into an expression algebra; keep PHP operator semantics and AST constructors in the PHP provider.
- `scannerStatementSequenceAlgebra` currently returns the accumulated prefix on a non-progressing resolver. Replace this silent truncation with an explicit `contract_violation` result before calling the scanner boundary closed.

## Verification

Run `npm run audit:phase1418-scanner-assignment-algebra`. Typecheck and fixture tests must be run in an environment with the workspace dependencies installed; the structural audit is not a substitute for either.
