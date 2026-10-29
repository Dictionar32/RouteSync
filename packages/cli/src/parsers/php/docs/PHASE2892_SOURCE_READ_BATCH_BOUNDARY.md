# Phase 2892 — Source Read Batch Boundary Audit

## Scope

Continue the Fully Typed Runtime Scanner Operations audit on the actual upstream CLI manifest construction path. This phase inspects the existing source-read batch contract and its composition call site. It does not claim a runtime migration or test-suite pass.

## Trace

`controllerInvocationManifestBuilder.build(...)` → CLI scan operation → `ControllerInvocationManifestCompositionAuthority.compose(...)` → project identity canonicalization → `LaravelControllerSourceDiscoveryInterface.discover(...)` → `LaravelControllerSourceDiscoveryResult.continueWith(...)` → `Promise.all(discoveredSources.map(sourceDocumentReader.read))` → `phpSourceDocumentIdentityBindingBatchFactory.bindReads(...)` → `phpSourceDocumentReadBatchFactory.fromResults(...)` → `PhpSourceDocumentReadBatchJudgment.continueWith(...)` → semantic judgment preparation → inventory closure → manifest builder judgment → CLI projection/output.

## Existing contracts to reuse

`packages/core/src/types/upstream/phpSourceFrontendInterface.ts` already defines `PhpSourceDocumentReadBatchCompleteEvidence`, `PhpSourceDocumentReadBatchBlockedEvidence`, `PhpSourceDocumentReadBatchJudgment`, `PhpSourceDocumentReadBatchFactoryInterface`, and `phpSourceDocumentReadBatchFactory`. The ADT owns accumulation and exposes `continueWith`; do not add another batch ADT.

## Concrete finding

The composition call site awaits `Promise.all(discoveredSources.map(...))` before invoking the identity-binding and read-batch contracts. The reader implementation currently catches expected filesystem failures and returns a blocked read result. However, an unexpected rejection from a substituted or faulty `sourceDocumentReader.read` implementation can reject the entire `Promise.all` and escape before a manifest terminal judgment is formed.

Do not silently map every rejected promise to `php_source_document_file_unreadable`: that would collapse an unexpected runtime/dependency failure into a filesystem diagnosis. The next implementation should model a domain-specific source-read operation failure, or prove and enforce the reader's no-rejection contract at the composition boundary, then migrate all consumers. Inspect existing upstream contracts first and preserve the distinction between complete, blocked filesystem evidence, and unexpected operation failure.

## ADT design direction

- Keep complete/blocked read aggregation on `phpSourceDocumentReadBatchFactory`.
- Add no generic collection abstraction and do not populate `collections.ts`.
- Keep serializable source document evidence separate from runtime-only operations.
- Preserve domain operations on each judgment; consumers should follow `continueWith` rather than inspect result discriminants themselves.
- Keep the runtime export interface-first: `export const operation: ExistingInterface = Object.freeze({...})`.
- Do not convert an AST/parser failure or source-read failure into a successful empty manifest.

## Validation boundary

This phase adds a reproducible structural audit. Full TypeScript typecheck, build, test suite, and CLI E2E are not claimed unless run with the project's required dependencies.
