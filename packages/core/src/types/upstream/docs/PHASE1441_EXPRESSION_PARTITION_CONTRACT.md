# Phase 1441 — Expression partition contracts

## Pipeline

`source tokens → scannerTokenStructureInterface occurrence evidence → expression form/operator algebra → closed partition judgment → PHP adapter wiring → AST structure projection`

## Changes

- `ConditionalExpressionContract` consumes `TokenOccurrencesJudgment<Token>` rather than numeric candidate indexes.
- `ConditionalExpressionResolution` returns `condition`, `consequent`, and `alternative` source partitions plus question/colon evidence. Malformed input points to a token or end-of-source.
- Root-operator algebra consumes occurrence evidence and returns `before`, `operatorEvidence`, and `after`; precedence and associativity remain owned by the upstream algebra.
- PHP wiring now supplies token vocabulary and the public `scannerTokenStructureInterface`, then projects partitions directly into the expression structure. It no longer re-slices the expression from a semantic root-operator index.
- Runtime array-access classification now consumes delimiter evidence instead of running its own backward delimiter-depth loop.
- The remaining `findTopLevelOperator` compatibility adapter delegates to the token-structure interface and only converts the evidence partition length to a legacy offset for four older runtime consumers (inline array key/value, match arms, `instanceof`, and collection iteration). This is an explicit migration frontier, not claimed as fully removed.

## Contract rules

- Missing condition/consequent/alternative and unmatched conditional markers produce malformed evidence, not partial success.
- Operator vocabulary and precedence rules are source-language facts; root selection and associativity are semantic algebra responsibilities.
- Public judgments carry source partitions and evidence, not cursor positions.
- Runtime is an adapter/projection layer; it should not independently rescan delimiters or decide expression precedence.

## Validation status

- Phase 1441 static source-boundary audit: 13/13.
- Prior phase audits are rerun separately and recorded in the phase audit JSON.
- The repository's installed JS toolchain is absent in this workspace (`tsdown`/Vitest unavailable), so a successful package build or Vitest run is not claimed.
- A targeted global `tsc` invocation reports errors in pre-existing imported modules; the latest run has no diagnostics directly in the Phase 1441 modified source files. This is not a clean repository-wide typecheck.
