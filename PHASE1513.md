# Phase 1513 — Semantic Rule Catalog Integrity

## Goal
Strengthen the existing upstream query semantic model so rule declarations are validated before they become runtime dispatch authority. Keep the existing interface; do not introduce a parallel semantic interface.

## Changes
- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`
  - Added `QueryOperationSemanticRuleCatalogValidation` as a closed validation judgment.
  - Added `validateQueryOperationSemanticRuleCatalog` to reject empty method domains, duplicate method ownership, mismatched rule/conclusion identity, missing premises, and missing constraints.
- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`
  - Validates the declared catalog before constructing the method dispatch index.
  - Fails fast on an invalid static rule model instead of silently allowing a second authority to reinterpret a claimed method.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`
  - Defers compatibility evidence extraction until after the legacy catalog explicitly claims the method.
  - Unknown methods no longer trigger scanner-side property/relation semantic interpretation before the catalog lookup.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`
  - Added tests for valid unique ownership, duplicate claims, and missing premises/constraints.
- `packages/core/src/index.ts`
  - Exports the validator and validation judgment from the existing upstream contract.
- `scripts/audits/audit-phase1513-semantic-rule-catalog-integrity.cjs`
  - Adds source-level audit for catalog integrity, scanner fallback boundary, and contract exports.

## Verification
- Phase 1512 source audit: PASS.
- Phase 1513 source audit: PASS.
- Full TypeScript check: BLOCKED by environment. The workspace has no `node_modules`; the globally installed TypeScript 5.8.3 cannot parse this project's configured target/lib values and cannot resolve Node/Vitest types. This is not a passing typecheck.
- Unit tests were added but could not be executed without project dependencies.

## Remaining frontier
- The catalog now validates declaration integrity, but premises/constraints are still partly descriptive. Existing rule-specific evaluators continue to validate arguments and construct ASTs.
- Next phase should implement a generic semantic kernel that interprets the declared premises/constraints and returns a rule-carrying judgment, then migrate the scanner legacy catalog family-by-family. Do not remove fallback until coverage tests prove each family is upstream-owned.
