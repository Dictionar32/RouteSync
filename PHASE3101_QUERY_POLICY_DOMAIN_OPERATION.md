# Phase 3101 — Query-Policy Domain Operation

## Scope

This phase continues the actual manifest-construction path by migrating the query-policy selection ADT away from its generic `continueWith<Result>(handlers)` operation.

## Runtime trace

`CLI scan/sync → controller invocation composition → upstream manifest builder → semanticDataflowManifestSurface.queryPolicyContractsFromJudgments → SemanticDataflowQueryPolicySelection.materializeQueryPolicyContracts → closed query-policy contracts → manifest construction → CLI terminal manifest → generator`.

## Source changes

- `packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts`
  - Removed `SemanticDataflowQueryPolicySelectionHandlers<Result>` and generic `continueWith<Result>`.
  - Added `materializeQueryPolicyContracts(judgments)` as a selection-owned domain operation.
  - Default selection materializes the explicit empty policy set.
  - Explicit selection materializes each judgment under its owned `SemanticDataflowQueryPolicyIntent`.
- `packages/core/src/types/upstream/semanticDataflowManifestSurface.ts`
  - Delegates policy materialization to the selection ADT instead of unpacking selection outcomes via handler callbacks.
- `packages/core/src/types/upstream/index.ts`
  - Removed the obsolete handler type from the public upstream barrel.
- `packages/core/src/index.ts`
  - Removed the obsolete handler type from the package barrel.
- `packages/core/src/types/upstream/__tests__/semanticDataflowRuntimeOperations.phase2980.test.ts`
  - Added regression coverage for the named selection-domain operation.
- `scripts/audits/audit-phase3101-query-policy-domain-operation.cjs`
  - Added structural audit and JSON report.

## Evidence and constraints

The migration is limited to the query-policy selection boundary. It does not claim that all generic continuations, control-flow primitives, or exported declarations have been migrated. The existing policy materializer still has its own validation and data-normalization logic; those concerns are outside this focused change.

The deleted relation-foundation modules remain absent and are not reintroduced.

## Verification

- Phase 3101 structural audit: passed.
- JSON package metadata: validated separately.
- Typecheck, full test suite, and PHP → CLI → manifest → generator E2E: not verified in this workspace.

## Repository-wide export frontier (AST inventory)

The companion AST inventory covers 2,244 TypeScript files across core, CLI, SDK, and React. It finds 520 exported function declarations and 459 exported arrow-variable declarations (979 candidates total under this inventory's definition). It also finds 63 generic `continueWith<Result>` arrow implementations in the scanned source. These are migration-frontier counts, not proof that all candidates can be converted mechanically; each operation needs an owning interface and preserved behavior.

Reproduce the inventory with `npm run audit:phase3101-export-migration-frontier` after installing the repository's declared dependencies. The current environment ran it using an available TypeScript compiler module, but did not run a full project typecheck or test suite.
