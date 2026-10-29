# Phase 1426 — Expression Operator Contract Migration

## Trace

`astClassifierRuntime.ts` delegated root-operator selection to `scannerExpressionOperatorAlgebra`, but it still owned the PHP operator catalog, precedence numbers, associativity declarations, and conversion from algebra outcomes to the scanner option type. That made the runtime file a semantic policy owner as well as an AST adapter.

## Migration

- PHP token spellings and supported PHP operator facts now live in `compiler/frontend/php/phpExpressionOperatorContract.ts`.
- The PHP contract invokes the language-neutral `scannerExpressionOperatorAlgebra` and adapts its closed resolution to the scanner's `RelationOption` boundary.
- `astClassifierRuntime.ts` calls `resolvePhpExpressionRootOperator()` and then recursively classifies operands and constructs PHP AST nodes. AST construction intentionally remains a language adapter responsibility.
- The upstream algebra now models `left`, `right`, and `non_associative` precedence tiers. A top-level chain with multiple operators in a non-associative tier returns `malformed` rather than silently selecting a root.
- The currently supported PHP comparison/equality operators are marked non-associative, following the PHP operator precedence manual.

## Verification

- Phase 1421 audit: 14/14
- Phase 1422 audit: 11/11
- Phase 1423 audit: 10/10
- Phase 1424 audit: 12/12
- Phase 1425 audit: 11/11
- Phase 1426 audit: 11/11
- Direct compiled algebra assertions: 4/4 (non-associative chain rejected, single comparison accepted, left-associative root selection, right-associative root selection)
- Focused TypeScript invocation reached pre-existing diagnostics in unrelated resource-model, AST semantic, and dataflow modules; no diagnostics named the three changed TypeScript files.
- `npm run build` remains blocked because `tsdown` is not installed in this workspace. Full package build and Vitest are therefore not claimed as passing.

## Remaining frontier

This does not yet unify full ternary and short-ternary into the same structural grammar. Several PHP operators are outside the current catalog. The contract should eventually be driven by an explicit PHP language-version grammar profile, and a recursive expression judgment should decide the entire expression form before AST projection. This phase is a focused migration, not a claim of complete PHP grammar coverage.
