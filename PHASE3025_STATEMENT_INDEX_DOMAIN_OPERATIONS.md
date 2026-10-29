# Phase 3025 — StatementIndex Domain Operations

## Implementation completed in this slice

- Replaced `StatementIndex = NumberValue` with a dedicated `StatementIndex` ADT (`kind: 'statement_index'`) whose ordinal is explicitly boundary/serialization evidence.
- Added `StatementIndexOperationsInterface` and `statementIndexOperations: StatementIndexOperationsInterface = Object.freeze({...})`.
- The domain operation object owns the initial statement position, successor operation, equality, and closed ordering judgments (`same_statement_index`, `earlier_statement_index`, `later_statement_index`).
- Migrated `phpControllerDataflowSourcePayloadEvidenceAdapter.ts` away from `let nextStatementIndex = 0` plus `+= 1`; it now advances through `statementIndexOperations.successor`.
- Updated the existing dataflow expectation for the new ADT shape and added focused tests for succession, comparison and equality.
- Added `npm run audit:phase3025-statement-index-domain-operations`.

## Runtime trace affected

PHP AST block traversal → `phpControllerDataflowSourcePayloadEvidenceAdapter` → `ControllerDataflowSourcePayload<PhpControllerDataflowPayload>` → `ControllerDataflowBindingPayloadCorrespondenceAuthority` → `ControllerVariableOrigin` (`assignment` / `foreach` / `catch`). The statement-order model now travels as a distinct domain type rather than masquerading as `NumberValue`.

## Important boundary

This is a real vertical slice, not completion of the broader primitive-removal objective. The `ordinal` still contains `NumberValue` as a representation witness, and the low-level successor operation necessarily translates between consecutive ordinals. Semantic consumers should use the domain operations rather than inspect `.ordinal.value` directly. Source offsets, truth/security decisions, name factories and remaining primitive control-flow patterns have not been migrated by this phase.

## Verification

- `node scripts/audits/audit-phase3025-statement-index-domain-operations.cjs` passes its static checks.
- Full TypeScript typecheck and Vitest execution could not be completed: this workspace has no installed `node_modules`, and the globally available TypeScript compiler is older than the project's configured TypeScript 7 / ES2025 target. The compiler failure is environmental and does not constitute a passing typecheck.
- Deleted relation foundation modules remain absent. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
