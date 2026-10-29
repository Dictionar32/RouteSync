# Phase 3078 — Source Read Rejection Inventory Domain Operations

## Scope

Continue the real upstream → CLI → manifest runtime path from Phase 3077. This phase moves rejected source identity accumulation into the source-read batch domain instead of reconstructing the inventory after all settlements have been collected.

## Implementation

Changed `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`:

- The source-read accumulator now owns the rejected `SourceFileInventory` as state.
- `includeRejected` adds the rejected source identity through `sourceFiles.include(settlement.sourceFile)` at the domain boundary.
- The final rejected batch uses that accumulated inventory directly; the post-hoc `rejected.reduce(...)` pass is removed.
- Fulfilled read order, rejection order, and normalized rejection evidence are preserved.
- The public settlement factory remains interface-first.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.

This is a focused ownership migration. It does not claim that all array collections, numeric cursor traversal, or generic continuation contracts have been removed.

## Runtime trace

```text
CLI scan / sync
  → manifest composition authority
  → source discovery inventory
  → source document reads
  → fulfilled/rejected settlement domain operations
  → source-read batch accumulator
       ├─ fulfilled: preserve read order
       └─ rejected: accumulate SourceFileInventory + ordered normalized evidence
  → batch judgment
       ├─ fulfilled: source identity binding → document batch
       └─ rejected: existing blocked manifest terminal
```

## Audit

Command:

`node scripts/audits/audit-phase3078-source-read-rejection-inventory-domain-operations.cjs`

Result: **13/13 structural checks passed**. The two changed TypeScript source files passed syntax transpilation without diagnostics. Existing audit artifacts for Phases 3077, 3076, 3075, 3074, and 3072 were checked for presence only; those audits were not rerun by this script.

## Limits and next frontier

- The final `PhpSourceDocumentReadOperationBatchJudgment` still exposes generic `continueWith<Result>` for manifest-facing fulfilled/rejected routing.
- The source-read batch traversal still uses an index and array collections.
- Whole-workspace strict TypeScript was not run.
- End-to-end PHP → CLI → manifest → generator execution was not run.
- Source discovery blocker evidence needs its own audit and normalization at the filesystem adapter boundary.
- Deleted relation foundation modules remain absent; no generic relation foundation was restored.

The next migration should replace the final batch continuation with a source-read-specific, manifest-neutral domain operation while preserving dependency direction: core must not import CLI terminal types.
