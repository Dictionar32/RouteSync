# Phase 2499 — Resource Expression Named Input Contract

## Change delivered

- Evolved the existing `ResourceAstExpressionMappingOperationInterface`; no parallel mapping interface was introduced.
- Added `ResourceAstExpressionMappingInput<SyntaxValue>` as a named upstream input carrying the syntax value and typed `SourceFile` identity.
- Changed the public operation to `export const mapResourceAstExpression: ResourceAstExpressionMappingOperationInterface<PhpAstValue> = input => ...`.
- Migrated all six known production consumer files to named object input; removed the public positional `(value, sourceFile?: string)` shape and old exported operation name.
- Exported the input type through the public core barrel.
- Updated Phase 2488/2498 audits and added `audit-phase2499-resource-expression-named-input-contract.cjs`.

## Evidence

- Phase 2499 contract audit: 10/10 assertions passed.
- Phase 2488 mapping contract audit: 11/11 assertions passed.
- Phase 2498 operation-owner audit: 11/11 assertions passed.
- Related resource audits: Phase 2487 10/10, Phase 2494 10/10, Phase 2495 10/10, Phase 2496 8/8, Phase 2497 9/9.
- TypeScript parser syntax check passed for all eight changed TypeScript modules plus the public entry.
- Relative-import probe found one unresolved import in the existing `responseDetector.ts`: `../../lexer/token` (no matching `token.ts` at that path); this import was not introduced by this phase and remains an explicit blocker.

## Remaining blockers — not claimed closed

- `resourceAstExpressionMapper.ts` still imports `semantic/relations`; semantic branching and resource-domain judgment have not yet been fully moved to an upstream semantic authority/closed ADT.
- `resourceProducer.ts` still imports `semantic/relations` and `subscanners/model/propertyProducer.ts`.
- `resourceFieldProducer.ts` still imports `subscanners/expressionAstCanonical.ts`.
- Some callers lack source-file evidence and explicitly use `createSourceFile('<scanner>')`; this is a provenance gap, not a verified source identity. The proper fix is to propagate the actual source identity through upstream input contracts, not hide the gap with another fallback.
- Nested recursive domain mapping still defaults to `'<scanner>'` in some branches; full provenance threading remains open.
- Whole-project TypeScript typecheck, package build, Vitest, and CLI end-to-end were not run. Syntax and structural audits do not prove full compilation or runtime correctness.

## Architectural conclusion

This phase fixes one upstream contract defect: the public mapping operation no longer accepts positional loose parameters and its source identity is explicitly typed. It does **not** close the larger semantic-authority or relation/subscanner migration. The next root-cause work must trace provenance and move semantic judgments into the existing upstream-owned authority/ADT before attempting to delete relation utilities or remaining subscanner imports.
