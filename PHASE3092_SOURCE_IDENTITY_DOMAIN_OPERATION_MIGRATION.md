# Phase 3092 — Source Identity Domain Operation Migration

## Scope

This phase removes the generic `continueWith<Result>` dispatch from the PHP source-read result ADT at the identity-binding boundary. It is a focused runtime migration, not a repository-wide export migration.

## Runtime trace

`CLI scan/sync` → `controllerInvocationManifestComposition.ts` → source-read settlement batch → `phpSourceDocumentIdentityBindingBatchFactory.bindReads(...)` → `phpSourceDocumentIdentityBinding.bind(...)` → `PhpSourceDocumentReadResult.bindIdentity(...)` → explicit complete-result or blocked-result identity-binding operation → identity judgment batch → source-read batch → semantic judgment preparation → manifest construction and CLI projection.

## Change

`PhpSourceDocumentReadResult` no longer exposes `continueWith<Result>(handlers)`. Its domain operation is now `bindIdentity(requestedSourceFile, operations)`. The operations contract is named for the two source-read judgments: `bindCompleteResult` and `bindBlockedResult`. The identity-binding authority owns identity rules and exposes those explicit operations. The result ADT selects the operation corresponding to the evidence it owns.

This removes the generic result type and the generic handler contract from this particular ADT boundary. It does **not** remove every generic continuation in the runtime, nor does it justify mechanically deleting all `switch`, `if`, primitive types, or sequence iteration throughout the parser. Those require domain-by-domain redesign that preserves evidence and language semantics.

## Data conservation requirements

- Complete reads retain their `PhpSourceDocument`.
- Blocked reads retain source identity and blocker evidence.
- Identity binding still checks the requested source against the observed source and blocker source.
- Identity mismatch remains a closed rejected judgment; it is not promoted into the complete source inventory.
- The core owns the source-read and identity-binding contract; CLI manifest terminal types remain outside core.
- Deleted relation-foundation modules under `packages/core/src/semantic/relations/` remain deleted and are not reintroduced.

## Validation status

Structural source checks are available in `scripts/audits/audit-phase3092-source-identity-domain-operation.cjs`. A full TypeScript typecheck, full test suite, and PHP → CLI → manifest → generator E2E are not claimed because dependencies are not installed in this workspace.

## Remaining frontier

The batch-level `PhpSourceDocumentReadOperationBatchJudgment.continueWith<Result>` and `PhpSourceDocumentReadBatchJudgment.continueWith<Result>` remain. They need separate domain-specific migrations that preserve the distinction between a rejected filesystem read, an identity rejection, a blocked source document, and a completed source batch. The repository-wide export inventory from Phase 3090 also remains outstanding (365 exported function declarations and 70 exported arrow constants at that snapshot).
