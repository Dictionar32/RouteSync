# Phase 3094 — Identity Judgment Batch Domain Operation

## Goal

Continue the real PHP source-read runtime migration from Phase 3093 by removing the generic callback continuation from the individual `PhpSourceDocumentIdentityBindingJudgment` ADT. A bound/rejected identity judgment now advances the source-identity batch through `contributeToBatch(accumulator)`.

## Runtime path changed

`controllerInvocationManifestComposition` → source-read settlement batch → `phpSourceDocumentIdentityBindingBatchFactory.bindReads` → `phpSourceDocumentIdentityBinding.bind` → individual identity judgment → `contributeToBatch` → identity-binding batch judgment → source-read batch → manifest continuation.

The changed boundary is:

- `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts`
- `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts`
- `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts`
- `packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts`

## Model change

`PhpSourceDocumentIdentityBindingJudgmentOperations` now exposes `contributeToBatch` with the concrete `PhpSourceDocumentIdentityBindingBatchAccumulator` domain contract. The identity batch factory no longer dispatches each individual judgment through generic `continueWith<Result>` handlers. The accumulator still has two explicit monotonic states: open and rejected. Rejected identity evidence and previously bound evidence remain preserved in the batch.

## Boundaries and non-claims

- The *individual* identity judgment's generic continuation was removed. The aggregate identity-binding batch judgment still has a generic continuation for CLI manifest composition; it is a separate migration frontier.
- The identity authority still contains explicit equality and switch-based classification. Phase 3094 does not claim all `switch`, `if`, equality, or other primitives have been removed.
- Repository-wide exported function/arrow conversion is not complete.
- Full TypeScript typecheck, full test suite, and PHP → CLI → manifest → generator E2E were not verified in this environment because project dependencies are unavailable.
- Deleted relation-foundation modules remain deleted and are not restored.

## Design references

TypeScript interfaces name structural contracts and function shapes: https://www.typescriptlang.org/docs/handbook/interfaces
PHP interfaces specify behavioral contracts: https://www.php.net/oop5.interfaces
Laravel route declarations and explicit model binding remain relevant source semantics: https://laravel.com/framework/docs/routing
