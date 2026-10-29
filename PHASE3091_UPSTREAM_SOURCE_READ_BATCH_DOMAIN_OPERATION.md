# Phase 3091 — Upstream source-read batch domain operation

## Scope

This phase makes one real runtime-path change in `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`. `PhpSourceDocumentReadResult` now exposes `contributeToBatch(accumulator)` as an explicit domain operation. The batch factory delegates each complete or blocked result to that operation rather than redispatching the result through a generic `continueWith<Result>` handler pair.

## Runtime trace

`laravelRouteScanner` → CLI source discovery/read composition → `phpSourceDocumentReadOperationBatchFactory` → `phpSourceDocumentIdentityBindingBatchFactory` → `phpSourceDocumentReadBatchFactory` → semantic judgment preparation → manifest terminal/projection → CLI generator.

At the source-document read batch stage, the result ADT now owns the domain transition:

- complete read → accumulator accepts the complete document;
- blocked read → accumulator accepts the full blocked evidence, including source identity and blocker.

The accumulator remains responsible for ordered accumulation and the terminal complete/blocked judgment. This preserves partial documents, blocked-read order, blocker identity, and the distinction between complete and blocked batches.

## Interface-first contract

`PhpSourceDocumentReadResultOperations.contributeToBatch` is explicitly typed against the source-read batch accumulator. The factory exports remain interface-typed objects. The operation does not introduce a second source of truth or a generic callback visitor.

## Remaining frontier

- `continueWith<Result>` remains on `PhpSourceDocumentReadResultOperations` temporarily because `phpSourceDocumentIdentityBindingAuthority.ts` still consumes it. Removing it requires migrating that consumer and all affected tests together.
- The source-read operation-batch judgment consumed by CLI still has its own generic continuation. It remains open because its fulfilled path binds source identity while its rejected path must preserve failure evidence into the CLI manifest terminal without introducing a core → CLI dependency.
- The repository-wide lexical inventory still reports 365 exported function declarations and 70 exported arrow constants. This phase does not claim all 435 candidates are migrated.
- Full typecheck, full test suite, and PHP → CLI → manifest → generator E2E are not verified in this environment because dependencies are not installed in the workspace.

## Guardrails

No relation foundation modules were restored under `packages/core/src/semantic/relations/`. No source evidence, blocker details, or provenance were intentionally discarded. This is a domain-level migration, not mechanical deletion of primitive types or parser control flow.
