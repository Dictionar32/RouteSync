# Phase2945 — Explicit Source Read Failure Operations

## Scope

Remove `try/catch` from the CLI source-read composition and shared filesystem reader path. Use Promise fulfillment/rejection callbacks to create existing domain settlement ADTs at the infrastructure boundary, and preserve the original rejected reason rather than discarding it.

## Runtime trace

`CLI manifest composition → SourceFileInventory.toSourceFiles() → PhpSourceDocumentReaderInterface.read() → PhpSourceDocumentReadResult` for filesystem outcomes, or `PhpSourceDocumentReadOperationSettlement` for a rejected reader Promise → `PhpSourceDocumentReadOperationBatchJudgment.continueWith()` → CLI source-read rejection terminal / identity binding → manifest build gate.

## Changes

- CLI source-read scheduling no longer uses `try/catch`; Promise `.then(onFulfilled, onRejected)` constructs the existing settlement ADT.
- Rejected settlement now preserves the original rejection reason as `failure`.
- Batch rejection preserves individual rejected evidence, including each failure reason, rather than only collecting source-file identities.
- The CLI terminal carries the rejection evidence onward instead of dropping it.
- The shared filesystem reader maps `readFile` Promise outcomes through `.then`; expected filesystem failures remain explicit `PhpSourceDocumentReadResult` blockers.
- No new generic Result/collection abstraction was introduced. `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification

Run `npm run audit:phase2945-source-read-no-try-catch`. This is a structural audit only; full TypeScript typecheck, tests, build, and CLI end-to-end are separate and not claimed here.
