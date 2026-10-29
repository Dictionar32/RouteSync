# Phase 3080 — Typed Runtime Scanner Operations: Next Migration Boundary

## Scope and source of truth

This phase continues the extracted Phase 3079 workspace. The implementation source of truth remains the real runtime path, not this report. No relation-foundation modules are restored and `packages/core/src/types/upstream/collections.ts` remains exactly one LF byte.

## Runtime path observed in code

`packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`

`discoveredSourcesContinuationOperation.continue`
→ `discoveredSourceReadSettlementOperation.readAll`
→ `phpSourceDocumentReadOperationBatchFactory.fromSettlements`
→ rejected batch: `sourceFiles` + ordered `rejections` → `sourceDocumentReadOperationRejected` manifest terminal
→ fulfilled batch: `reads` → `phpSourceDocumentIdentityBindingBatchFactory.bindReads`
→ identity rejection terminal or bound reads
→ `phpSourceDocumentReadBatchFactory.fromResults`
→ blocked document terminal or complete-document continuation
→ semantic invocation / manifest builder pipeline.

## Domain contract currently implemented

`packages/core/src/types/upstream/phpSourceFrontendInterface.ts` owns the settlement ADT and batch accumulator. Each rejected settlement contributes its `SourceFile` to the batch-owned `SourceFileInventory` immediately. Finalization forwards the accumulated inventory; it does not reconstruct the inventory with a post-hoc `reduce`. Read order, rejection order, and normalized failure evidence are retained.

The runtime exports use interface-first objects, e.g. `export const phpSourceDocumentReadOperationSettlementFactory: PhpSourceDocumentReadOperationSettlementFactoryInterface = Object.freeze({...})`.

## Remaining migration blockers (not falsely marked complete)

1. `PhpSourceDocumentReadOperationBatchJudgment` still exposes `continueWith<Result>`. The correct replacement must remain source-read-owned and manifest-neutral; making `core` depend on CLI manifest terminal types would reverse dependency direction.
2. `fromSettlements` still performs index-based traversal (`index`, `index + 1`, indexed access) inside the source-read domain factory. This is encapsulated from the CLI, but it is not yet a typed cursor/sequence model.
3. `PhpSourceDocumentReadBatchJudgment` also exposes generic continuation; migrate separately after the source-read batch contract, preserving complete-vs-blocked semantics and partial documents.
4. The real scan/sync path has additional query-policy and manifest-builder continuations; migrate only after confirming their reachable consumers and ownership.
5. The repository has a known audit debt: 478 stale import lines across 251 files still reference deleted relation-foundation modules. Do not restore those modules to make imports pass. Migrate consumers to their owning domain interfaces.

## Primitive-removal policy

Do not delete `string`, `number`, `boolean`, `null`, `undefined`, arrays, `map`, `if`, `===`, `as`, `void`, visitors, or switch syntax globally. First classify each occurrence by whether it represents domain knowledge, a transport representation, or necessary parser/scanner mechanics. Raise domain decisions into typed ADTs; do not merely move primitive conditionals to another file. Keep PHP syntax facts, source provenance, rejection evidence, source identity, and manifest blockers lossless.

## Verification performed

- `audit-phase3078-source-read-rejection-inventory-domain-operations.cjs`: PASS, 13/13 structural checks.
- `audit-phase2935-fully-explicit-runtime-scanner-operations.cjs`: PASS, 13/13 structural checks.
- `audit-phase2973-explicit-runtime-scanner-operations.cjs`: 14/15; the sole failure is its upstream collections emptiness check, which conflicts with the deliberate one-newline-byte invariant. It also reports 478 stale relation-foundation import lines as unresolved migration debt.
- Whole-workspace strict TypeScript, full test suite, and PHP → CLI → manifest → generator end-to-end test: not run; dependencies are not installed in the extracted workspace.

## Next implementation sequence

1. Define a source-read-owned closed batch outcome contract without a generic result parameter and without CLI imports.
2. Wire the composition to consume that domain contract while preserving Promise result and terminal evidence.
3. Add a typed source-settlement cursor owned by the source-read domain; preserve ordering and empty-batch behavior.
4. Migrate the subsequent document-read judgment only after the first contract passes focused tests.
5. Resolve stale relation-foundation consumers by domain ownership, not by restoring the deleted generic foundation.
6. Run strict TypeScript, focused tests, and a real Laravel/PHP fixture through the full CLI → manifest → generator path.
