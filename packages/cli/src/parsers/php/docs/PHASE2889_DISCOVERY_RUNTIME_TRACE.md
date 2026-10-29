# Phase 2889 — Discovery Runtime Trace and ADT Ownership Audit

## Scope

This phase audits the next boundary after Phase 2888. It does not claim a broad migration or successful typecheck/build/test run.

## Canonical runtime trace

`controllerInvocationManifestBuilder.build(...)` → CLI scan operation `.scan(...)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(...)` → source-project canonicalization `.continueWith(...)` → `LaravelControllerSourceDiscoveryInterface.discover(...)` → `LaravelControllerSourceDiscoveryResult.continueWith(...)` → source document reads → identity-binding batch `.continueWith(...)` → source-read batch `.continueWith(...)` → semantic judgment preparation `.continueWith(...)` → inventory closure → manifest-builder judgment `.continueWith(...)` → manifest terminal `.continueForDriftAudit(...)` → CLI projection/output.

## Existing contracts reused

`packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` already owns:

- `LaravelControllerSourceDiscoveryEvidence`, with explicit complete and blocked evidence;
- `LaravelControllerSourceDiscoveryJudgmentOperations`, with `continueWith`;
- `LaravelControllerSourceDiscoveryResult`, which combines each evidence variant with that operation;
- `LaravelControllerSourceDiscoveryInterface`, which defines the discovery runtime contract.

No new discovery interface is justified by this audit.

## Findings

1. The composition path consumes `discovery.continueWith(...)`; it does not need to dispatch on discovery `kind` at the composition boundary.
2. The discovery producer still decorates the result with an inline `continueWith` implementation that uses a ternary over `evidence.kind`. The branch has been moved to the producer boundary, not eliminated. This is the next ADT-ownership candidate: make complete/blocked evidence construction produce the appropriate operational variant directly, while keeping filesystem failure classification in the filesystem authority that owns it.
3. Recursive discovery uses `readonly string[]` as its accumulator and repeatedly maps `SourceFile` values back to `source.value.value` before wrapping them again. That is a primitive representation boundary worth examining. It must not be “fixed” by deleting every `map`; the intended change should keep filesystem path operations explicit while preserving `SourceFile` as domain evidence at contract boundaries.
4. Source-read batching uses `Promise.all(discoveredSources.map(...))`. This is a collection transformation, not by itself proof of a faulty ADT. Keep it unless a domain contract is identified that should own the read operation and its rejection/blocked semantics.
5. Failure is represented as blocked discovery evidence; it must not be converted into a successful empty source inventory.

## Recommended next implementation

Refactor only the discovery producer and recursive accumulator after checking the complete call graph. Preserve `LaravelControllerSourceDiscoveryInterface` and the existing evidence ADT. Construct the operational result alongside each complete/blocked evidence branch so the consumer doesn't classify it; avoid introducing generic `Result`, `Sequence`, collection helpers, or duplicate authorities. Then migrate all direct call sites and run targeted typecheck/tests if the project's dependency environment is available.

## Validation boundary

This is a source audit and trace. It does not establish full TypeScript typecheck, build, test-suite, or CLI E2E success.
