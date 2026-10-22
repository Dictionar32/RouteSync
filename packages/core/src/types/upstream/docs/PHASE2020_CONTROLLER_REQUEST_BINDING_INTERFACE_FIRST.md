# Phase 2020 — Controller Request Binding Interface First

## Trace

`resolveControllerActionContract()` already returns `ControllerActionContract.request`, whose `ControllerRequestBinding` ADT is also the declared type of `ScannedControllerActionParams.request`. `actionScanner.ts` rebuilt three variants with `relationGate`/`relationEqual`, but that projection omitted the existing `typed` variant and therefore did not faithfully preserve the upstream contract.

## Contract-first correction

The existing `LaravelSubscannerRetirementInterface` was evolved to version 14. Its responsibility type map now binds `ControllerActionContract['request']` to `ControllerActionInfo['request']` and states the law: forward the existing closed request-binding ADT without reclassification. This reuses existing types and adds no authority or subscanner.

## Runtime executor correction

`actionScanner.ts` now forwards `request: contract.request`. It reuses the existing `ControllerActionContractResolverContext` property types for its index and contextual-attribute inputs, eliminating its direct import of `semantic/relations` helpers and types. The scanner no longer performs a second semantic classification of request binding.

## Scope and limitations

- No `relation` or `foundation` subscanner directory is added; neither directory exists in this archive.
- This phase removes the `semantic/relations` dependency from `actionScanner.ts` only. Other controller modules and descriptor files still import relation utilities; the whole Laravel scanner is not yet relation-free.
- No replacement subscanner, second authority, or moved semantic function is introduced.
- The audit is structural. Full TypeScript typecheck/build and full integration tests are not claimed.
