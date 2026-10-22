# Phase 1497 — Query Operation Judgment Preservation

## Intent

Move the query model from “resolved operation list only” toward an interface-first semantic contract. A missing operation is not enough to represent all semantic outcomes: a recognized but malformed join must remain distinguishable from a method that is not handled by the join resolver.

## Changes

- `packages/core/src/types/upstream/query.ts`
  - `QueryAst` and `QuerySubqueryAst` now carry `operationJudgments` as a sequence of `QueryProducerSemanticJudgment<QueryOperationAst>`.
  - The existing `operations` sequence remains as a compatibility projection for consumers not yet migrated.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`
  - The query-chain traversal now records a judgment for each operation position.
  - Join methods ask `queryProducerSemanticAlgebra.resolveQueryJoinOperation` for the closed judgment.
  - `malformed` judgments are retained in `operationJudgments`; they are no longer collapsed to an empty legacy option in the new semantic channel.
  - The compatibility `operations` list is projected only from `resolved` judgments.
- `scripts/audits/audit-phase1497-query-operation-judgment-preservation.cjs`
  - Checks the AST contract, upstream delegation, preservation channel, and compatibility projection.

## Boundary status

This phase is a vertical slice, not a claim that the entire scanner is executor-only. The non-join `queryNamedMethodOperationCatalog` still classifies many query methods in scanner code. The new judgment channel also wraps those legacy resolutions, so those methods do not yet all have upstream-owned semantic judgments. The next migration should move those method rules into upstream algebra/interface, then migrate downstream consumers from `operations` to `operationJudgments` and remove compatibility projections when no longer needed.

## Verification

- `node scripts/audits/audit-phase1496-interface-first-query-join.cjs`: PASS (5 checks).
- `node scripts/audits/audit-phase1497-query-operation-judgment-preservation.cjs`: PASS (6 checks).
- TypeScript syntax transpilation: PASS for the modified query model, query producer, and affected controller contract test.
- Full build: NOT VERIFIED. `npm run build` cannot start because `tsdown` is not installed in this workspace. A scoped `tsc` attempt reports numerous pre-existing scanner/type errors outside this phase; it is not a clean type-check signal.
