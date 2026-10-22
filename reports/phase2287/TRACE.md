# Phase 2287 Trace — Contextual Attribute Closed Scan Outcome

## Finding

The previous `LaravelAttributeScannerInterface` result had only a complete result shape. An unresolved PHP class-name context could not be represented as a typed blocked outcome, creating pressure either to throw outside the contract or to publish a false empty inventory.

## Upstream change

- Evolved `LaravelAttributeScannerInterface` and scan result contract from version 5 to version 6.
- Added `LaravelAttributeScanCompleteJudgment` and `LaravelAttributeScanBlockedJudgment` as a discriminated union.
- Added `LaravelAttributeScanBlocker`, carrying the existing blocked `PhpClassNameResolution` and source provenance.
- Kept ASTs and contextual inventory exclusive to the complete variant.
- Kept `LaravelControllerScannerInterface` input constrained to the existing complete `LaravelContextualAttributeInventory`.

## Not claimed

- The regex in `attributeAstCanonical.ts` is not removed in this interface-only phase.
- The source-AST composition root still constructs version 5 and still does not provide the new proof fields. This is known integration debt for the next wiring phase.
- No TypeScript typecheck or build was run.

## Validation

Run `node scripts/audits/audit-phase2287-attribute-scan-closed-outcome.cjs` and `node --check scripts/audits/audit-phase2287-attribute-scan-closed-outcome.cjs`.
