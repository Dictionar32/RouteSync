# Phase 3125 — Upstream-Owned Manifest Terminal Operation

## Runtime migration

The CLI manifest composition previously selected complete versus blocked terminal behavior by inspecting `judgment.kind`. This left domain knowledge in the CLI control flow.

The closed upstream `ManifestBuilderJudgment` now owns the operation that follows its outcome:

- `ManifestBuilderCompleteJudgment.requireCompleteManifest()` returns the exact canonical `RouteSyncManifest`.
- Both blocked variants implement `requireCompleteManifest(): never` and throw `ManifestBuilderBlockedError`.
- `ManifestBuilderBlockedError.judgment` retains the original blocked judgment, including stage, blocker kind, source identity, and source AST/source-model evidence.
- `controllerInvocationManifestTerminalOperationsFactory.fromManifestBuilderJudgment` now binds the upstream operation to the CLI terminal interface. It no longer dispatches on `kind`.

No generic visitor was added. No deleted relation foundation was restored.

## Runtime trace

`source discovery → PHP source read and identity binding → invocation judgment inventory → inventory.buildManifest(...) → ManifestBuilderOperationPreparationInterface.prepare(...) → ManifestBuilderInterface.build() → ManifestBuilderJudgment.requireCompleteManifest() → CLI terminal wrapper → manifest projection / generated output`

The upstream builder creates the operation at the same time as each outcome, so the CLI no longer decides whether an outcome is complete or blocked. The exact blocker remains attached to the thrown error.

## Verification

Run `node scripts/audits/test-phase3125-upstream-owned-manifest-terminal-operation.cjs`.

This CJS static test checks the adapter, upstream contract, both blocked construction sites, public export, and absence of the deleted relation foundation. It does not replace a full TypeScript typecheck or end-to-end run.

## Scope boundary

This phase removes outcome dispatch from one real CLI manifest boundary. It does not claim repository-wide conversion of every export, removal of all `if`/`switch`/`??`/ternary/`map`/`reduce`, or completion of every runtime scanner path.
