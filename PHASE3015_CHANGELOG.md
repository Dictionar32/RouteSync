# Phase 3015 changelog

- Added `InvocationSemanticContractOperationsInterface` with typed `validateInput` and `validateJudgment` domain operations.
- Converted two exported standalone validation helpers into private implementations owned by `invocationSemanticContractOperations`.
- Updated single-invocation and whole-knowledge authorities to dispatch validation through the shared operation object.
- Added repeatable structural audit script `scripts/audits/audit-phase3015-invocation-contract-operations.cjs`.
- Structural audit passed 9/9; syntax transpilation passed for 2 files with 0 diagnostics; targeted strict typecheck passed for 3 upstream files.
- Unit tests, full repository typecheck, build, and Laravel CLI end-to-end remain unrun.
- Preserved the one-newline `collections.ts` invariant and kept deleted relation foundation modules absent.
