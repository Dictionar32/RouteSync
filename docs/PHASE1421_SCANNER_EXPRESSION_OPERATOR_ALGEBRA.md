# Phase 1421 — Scanner Expression Operator Algebra

## Ownership change

`scannerExpressionOperatorAlgebra.ts` now owns generic candidate selection for binary expression roots: lowest-binding precedence wins, left-associative operators split at the rightmost matching occurrence, and right-associative operators split at the leftmost occurrence. It returns a closed resolution ADT (`resolved`, `not_found`, `malformed`, `contract_violation`).

`scannerTokenStructureAlgebra.ts` now collects all requested top-level operator occurrences in one delimiter-aware traversal. It excludes nested occurrences and reports malformed delimiter structure rather than returning a partial candidate list.

`astClassifierRuntime.ts` supplies PHP operator spellings, AST operator values, precedence, and associativity. It delegates candidate selection and translates malformed/invalid contract outcomes into explicit errors. It no longer contains the generic candidate projection/selection loop.

## Important scope boundary

This phase does not claim to move all PHP expression grammar out of runtime. Ternary, array access, calls, unary expressions, and PHP-specific AST construction remain in the PHP adapter. The next useful migration is to audit ternary and unary resolution using the same closed-result ownership rules, then move generic argument/member traversal where it is genuinely reusable.

## Verification

- `audit:phase1421-scanner-expression-operator-algebra` checks ownership, ADT closure, malformed propagation, precedence facts, and preservation of the `tsdown` build script.
- Focused TypeScript compilation covers the token structure and expression operator algebra modules.
- Focused runtime assertions cover precedence, associativity, nested operator exclusion, malformed delimiters, and duplicate rule and conflicting-associativity rejection.
- Full repository build/typecheck remains pending because this workspace does not have `tsdown` installed and a broader runtime typecheck reports pre-existing unused imports and unrelated scanner semantic/query producer type errors.
