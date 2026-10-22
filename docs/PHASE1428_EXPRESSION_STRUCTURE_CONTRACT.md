# Phase 1428 — Expression structure contract

## Trace

`classifyCompoundExpression()` previously selected candidates whose resolvers returned `RelationOption<PhpAstValue>`. Candidate recognition and AST construction therefore happened inside the same callback, and the generic candidate algebra only arbitrated completed AST values.

## Migration

- Added `scannerExpressionStructure.ts`, a closed syntax-level ADT for short ternary, ternary, array access, calls, binary expressions, and unary expressions.
- `classifyCompoundExpression()` now asks candidate providers for an `ExpressionStructure` first.
- Candidate providers return token partitions and operator facts, not AST nodes.
- PHP AST construction happens only after the generic candidate algebra has selected a structural judgment.
- Removed the now-redundant compound call AST resolver and unary AST resolver; their structure recognition is performed before projection.
- Exported the structure contract through the upstream type surface.

## Ownership after this phase

`PHP token evidence -> structural candidate contract/algebra -> closed ExpressionStructure -> PHP AST projection`.

The PHP adapter still supplies token-specific recognition facts and the AST factory. This phase moves AST construction out of candidate arbitration, but it does **not** claim that all syntax recognition or all semantic reasoning has left `astClassifierRuntime.ts`. Top-level classification and several expression forms still use the existing callbacks and need later migration to declarative evidence relations.

## Verification

- `audit:phase1428-expression-structure-contract`: 8/8.
- Phase 1423 audit updated to reflect prefix resolution inside structural candidate production: 10/10.
- Phase 1425 audit updated to verify recursive operands are projected from structural slices: 11/11.
- Strict TypeScript invocation reports no diagnostics in `astClassifierRuntime.ts` or `scannerExpressionStructure.ts`; unrelated existing diagnostics remain in other scanner modules.
- Full package build and Vitest are not claimed: `tsdown` and Vitest are not installed in this workspace.
