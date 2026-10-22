# Phase 1773 — Function Callee Source-Span Contract

## Trace

The Phase 1772 AST retained all callee tokens but did not retain a span specific to the callee. The general expression `source` belongs to the complete call and can include arguments; it is not a substitute for the name's own provenance.

## Interface-first change

`PhpFunctionNameSourceEvidence` now requires both the complete lexical token sequence and a `SourceRange` for the callee. `PhpAstFactory.functionNameSourceEvidence` requires the range, and `phpExpressionStructureProjector.ts` supplies the start of the first callee token and the end of the last callee token.

This improves source provenance without prematurely canonicalizing the PHP name. It does not claim that namespace/import resolution is complete.

## Remaining blockers

- `resourceUpstreamExpressionCanonical.ts` still calls the legacy `phpFunctionCallSemanticAuthority` with the compatibility short identifier.
- The source evidence has not yet been adapted to `PhpFunctionNameSyntaxEvidence` plus a complete `PhpFunctionResolutionEnvironmentJudgment`.
- `PhpFunctionNameResolutionAuthorityInterface` still has no integrated implementation/publication path.
- Resource subscanner retirement is not complete; its consumers must be migrated and references audited before removal.

## Validation

Run `node scripts/audits/phase1773-function-callee-source-span-contract.mjs` and the Phase 1772/1771 static audits. TypeScript typecheck, tests, and full build are intentionally not claimed.
