# Phase 1456 — Cast Expression Contract

## Trace

`Token evidence → ScannerCastExpressionInterface → scannerCastExpressionContractAlgebra → cast judgment → AST executor → AST consumer`

## Finding

`classifyCast` previously constructed all six candidate values eagerly. Each candidate called `classifyAstTokens(tokens.slice(3))` before `solveCandidate` checked its requirements. When the input was not a cast—or when the suffix was empty—this recursively classified an empty token sequence and re-entered `classifyCast`, producing `RangeError: Maximum call stack size exceeded`.

## Contract-first correction

- `scannerCastExpressionInterface.ts` defines `resolved`, `not_applicable`, and `malformed` judgments.
- `scannerCastExpressionAlgebra.ts` owns the closed cast-type vocabulary and recognizes the source structure. It returns the operand partition without classifying it or constructing AST nodes.
- `astClassifierRuntime.ts` asks the algebra first. It only invokes `classifyAstTokens` for the operand after receiving `resolved`.
- Missing closing delimiters and missing operands become explicit malformed judgments.
- The upstream barrel exports the interface and canonical algebra.

## Verification boundary

The new interface and algebra pass a focused TypeScript check. Runtime probes confirmed ordinary identifiers no longer recurse, valid casts produce `cast_expression`, and a cast without an operand produces an explicit malformed-cast error. The full repository build remains unavailable because `tsdown` is not installed. A full AST/downstream suite was not run; unrelated type diagnostics remain in the broader dependency graph.
