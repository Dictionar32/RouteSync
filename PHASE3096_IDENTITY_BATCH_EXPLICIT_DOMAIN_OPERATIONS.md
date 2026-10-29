# Phase 3096 — Identity Batch Explicit Domain Operations

## Scope

This phase migrates one concrete boundary in the PHP scanner runtime: the `PhpSourceDocumentIdentityBindingBatchJudgment` no longer exposes a generic `continueWith<Result>(handlers)` operation.

## Domain contract

- A bound identity batch exposes `toSourceReadBatch(factory)`, which advances its ordered, bound read evidence into the source-document read-batch domain.
- A rejected identity batch exposes `preserveRejectedEvidence()`, retaining the original rejected identity evidence and preventing rejected reads from entering the complete source inventory.
- The CLI composition consumes these named operations instead of passing generic `onBound` / `onRejected` handlers to the identity-batch judgment.

## Runtime trace

`CLI scan/sync` → `controllerInvocationManifestComposition` → PHP source-read settlement batch → `bindIdentityBatch(...)` → identity-binding batch judgment → `toSourceReadBatch(...)` or `preserveRejectedEvidence()` → source-document read batch / explicit terminal manifest result → manifest composition → generator.

## Verification

Run `npm run audit:phase3096-identity-batch-explicit-domain-operations`.

The audit verifies the targeted interface, authority, consumer and regression-test structure. It does not substitute for TypeScript compilation, the full test suite, or an end-to-end PHP → CLI → manifest → generator run. Those remain unverified in this workspace because project dependencies are not installed here.

## Remaining work

- The CLI still has a discriminated branch for rejected identity batches; this phase does not claim all `if`, `switch`, equality checks, or other listed primitives have been removed.
- The next source-document read batch still uses a generic continuation and should be migrated separately through its own domain operations.
- Repository-wide conversion of every `export function` and untyped exported arrow to `export const name: Interface = ...` is incomplete.
- No deleted relation-foundation module is restored or re-exported.
