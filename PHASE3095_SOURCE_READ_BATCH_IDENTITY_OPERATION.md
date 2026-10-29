# Phase 3095 — Source-Read Batch Identity Operation

## Scope

This phase migrates the source-read operation batch boundary in the real PHP scanner runtime path. It replaces the generic `continueWith<Result>` continuation on `PhpSourceDocumentReadOperationBatchJudgment` with named domain operations.

## Runtime change

- A fulfilled source-read batch exposes `bindIdentityBatch(operations, binding)`, which delegates its ordered read evidence to the identity-binding batch operation.
- A rejected source-read batch exposes `preserveRejectedEvidence()`, keeping its source inventory and individual read failures intact.
- CLI composition calls the named operation instead of dispatching the source-read batch through generic handlers.
- The identity-binding batch still uses its own generic continuation. That is the next migration frontier; this phase does not claim it has been removed.

## Runtime trace

`CLI scan/sync → controller invocation manifest composition → source document reader → settled read operations → source-read operation batch → bindIdentityBatch → identity-binding batch → source-read document batch → manifest terminal/composition → generator`

## Audit status

The audit script checks the new named operations, removal of the generic source-read batch continuation, and a regression test. The CLI composition still has an explicit discriminant branch for the rejected source-read batch, and the downstream identity-binding batch continuation remains generic. These are recorded as open modeling work, not hidden by mechanical replacement.

Full TypeScript typecheck, full tests, and PHP-to-CLI-to-manifest-to-generator E2E are not verified in this environment because project dependencies are unavailable.

## Invariants

- Preserve requested source identity and ordered read evidence.
- Preserve every rejected read and its failure evidence.
- Keep core independent of CLI manifest types.
- Do not restore the deleted relation foundation modules `relationMembership`, `relationalSequence`, or `semanticRelations`.
