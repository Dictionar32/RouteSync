# Phase 2281 — Laravel Scanner Typed Contextual-Attribute Input Contract

## Scope

Interface-first only. This phase changes upstream type contracts and migration obligations; it does not modify scanner/runtime implementation or move semantic logic between files.

## Trace finding

The production path still reaches `LaravelControllerScannerInterface.scan(...)`, then `LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)`, and the existing `ControllerDependencySemanticJudgmentAuthorityInterface`. The dependency authority already consumes `customContextualAttributeNames: readonly ClassName[]`, while the scanner and action-judgment inputs exposed the same semantic fact as `readonly string[]`.

That mismatch allowed an unvalidated primitive-name collection to cross the scanner/action semantic boundary even though the existing upstream authority has the stronger semantic type. This is a real type-contract gap, not a need for another generic wrapper or another authority.

## Changes

- `LaravelControllerScanInput.contextualAttributeNames` now uses the existing `ClassName` value object.
- `LaravelControllerActionSemanticJudgmentInput.contextualAttributeNames` now uses the same existing `ClassName` value object.
- The existing `LaravelControllerActionProjectionMigration` ADT records this primitive-input migration as an explicit obligation; it does not claim the runtime adapter has already migrated.
- `LaravelControllerActionSemanticJudgmentContract.version` advances from 50 to 51.
- `LaravelControllerScannerInterface` and its complete/blocked scan result contracts advance from version 38 to 39.
- No new authority, generic wrapper, or duplicate scanner interface was introduced.
- No `semantic/foundation` or `semantic/relations` import was added.

## Deliberately not changed

The runtime scanner and action-wiring implementations still provide/consume the older string-shaped value and retain the previous version literals. That implementation is now an explicit follow-up wiring task after the upstream contract is established. This archive is therefore a contract-first step, not a claim of typecheck/build readiness. Runtime behavior was not edited.

## Validation

The phase audit checks the stronger upstream input types, their correspondence with the existing dependency authority's `ClassName[]` contract, the typed migration obligation, contract-version evolution, and absence of forbidden foundation/relation imports in the scanner interface. Audit script syntax and ZIP integrity are checked. TypeScript typecheck and package build are not run; the implementation is intentionally not wired in this interface-first phase.

## Next step

Adapt the CLI/source configuration boundary to produce the existing `ClassName` values, then thread those values unchanged through scanner and action judgment wiring. Do not add semantic classification to runtime; any name resolution must remain owned by its existing upstream authority.
