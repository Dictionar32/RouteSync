# Phase 1370 — Semantic Reasoning Interface Wiring Trace

## Trace result

- Operation identity: route producer -> `operationIdentityCapabilityFromRoute` -> `operationIdentityCapabilityAlgebra` -> `OperationIdentityCapabilityContract` with preserved reasoning proof -> `operationIdentityProjection` -> CLI API object emission -> SDK `defineApi` fail-closed consumption.
- AST/dataflow: typed AST/knowledge seeds -> `SemanticDataflowInput` -> `semanticDataflowAuthority` closes facts/reachability/path evidence -> `SemanticDataflowJudgment` -> `semanticDataflowDataFlowAdapter` preserves the exact reasoning contract -> generic `DataFlowInterface` authority -> analysis/IR/CLI consumers. AST nodes and data-flow nodes remain distinct representations.
- Model/schema: `schemaRelationIndexFrom` selects schema tables and primary columns once. The model builder now creates that index before primary-key reconciliation and passes the same index into `reconcileModelPrimaryKey`, then reuses it for relation reconciliation.
- Cross-layer coverage: the existing `scripts/audit/semantic-ownership-coverage.cjs` remains the broad guardrail. The phase-specific audit records active operation identity, dataflow, SDK/React/CLI, and Laravel-example boundaries.

## Implementation

`modelPrimaryKey.ts` previously searched raw schema tables and filtered raw schema columns independently, duplicating the table/primary-key selection already performed by `SchemaRelationIndexInterface`. It now consumes the index contract and converts only its selected primary-column sequence into the closed reconciliation result. The existing four statuses remain: `matched`, `conflict`, `unresolved`, and `ambiguous`.

No duplicate AST solver, dataflow authority, or downstream identity classifier was introduced. React/SDK/CLI are consumers/projections; they must not reclassify method/path/action semantics. Laravel source is source evidence; Next.js-facing generated endpoint code is target projection, not a second source of truth.

## Verification

Run `npm run audit:phase1370-semantic-reasoning-interface-wiring` and the existing phase audits. The phase audit checks source wiring and ownership boundaries only. It does not replace TypeScript typecheck, focused Vitest execution, or the full package build.
