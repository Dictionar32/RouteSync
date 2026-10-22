# Phase 1498 — Query Basic Operation Authority

## Objective

Continue the interface-first query migration by moving `where`, `orWhere`, `whereNot`, and `orWhereNot` meaning out of the scanner's name-to-resolver catalog and into the upstream semantic algebra exposed through `QueryProducerSemanticInterface`.

## Changes

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`
  - Adds `resolveQueryBasicOperation(methodName, arguments_)` as a closed semantic judgment contract.
- `packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts`
  - Owns basic where-family method recognition, argument validation, comparison operator selection, nested callback conditions, and the resulting `QueryOperationAst` projection.
  - Returns `not_applicable` for unrelated names and `malformed` for recognized methods with insufficient/invalid evidence.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`
  - Delegates where-family resolution to upstream algebra.
  - Removes the local `where`/`orWhere`/`whereNot`/`orWhereNot` resolver entries.
  - Preserves malformed basic-operation judgments in the `operationJudgments` channel instead of collapsing them to an absent legacy option.
  - Retains the legacy `operations` projection for existing consumers.
- `scripts/audits/audit-phase1498-query-basic-operation-authority.cjs`
  - Guards the authority boundary and malformed judgment preservation.

## Architecture status

This is a concrete vertical slice, not a claim that the entire scanner is executor-only. The remaining `queryNamedMethodOperationCatalog` still owns semantic resolution for other query method families. The next migration should extract the next cohesive family (for example between/in/null predicates or relation operations) into upstream contracts, then migrate consumers to read judgments directly.

## Verification

- Phase 1495 query operation authority audit: PASS.
- Phase 1497 judgment preservation audit: PASS.
- Phase 1498 authority audit: see `npm run audit:phase1498-query-basic-operation-authority`.
- TypeScript syntax transpilation is checked separately; full build is not claimed unless dependencies and the configured build executable are available.
