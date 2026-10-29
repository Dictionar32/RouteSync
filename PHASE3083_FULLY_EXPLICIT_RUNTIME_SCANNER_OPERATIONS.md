# Phase 3083 — Fully Explicit Typed Runtime Scanner Operations

## Scope

This phase advances the actual upstream → CLI → manifest → generator path by making source identity batch aggregation a closed, monotonic domain state. It does not claim to remove every primitive or generic continuation from the repository.

## Implementation

- `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts`
  - Rejected batch evidence now carries prior successful `bindings` and their `readResults` alongside all identity rejections.
  - A rejected batch therefore records the complete useful outcome rather than discarding successful identity work when any other item is rejected.
- `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts`
  - Replaced the final `rejections.length === 0` classification with an explicit open/rejected accumulator state.
  - First rejection transitions open → rejected.
  - The rejected state retains later successful bindings and later rejections, but has no transition back to the open/bound state.
  - The runtime export remains `export const phpSourceDocumentIdentityBindingBatchFactory: PhpSourceDocumentIdentityBindingBatchFactoryInterface = Object.freeze(...)`.
- Added `scripts/audits/audit-phase3083-identity-binding-monotonic-batch.cjs` and `PHASE3083_IDENTITY_BINDING_MONOTONIC_BATCH_AUDIT.json`.

## Runtime trace

`scan/sync → manifest scan operation → Laravel controller source discovery → SourceFileInventory → source read settlements → source-read batch judgment → identity binding → identity-binding batch judgment → document read batch → semantic invocation → manifest composition/projection → manifest contract validation → canonical manifest JSON save`.

The core upstream ADT remains independent of CLI terminal manifest types. CLI composition owns mapping domain judgments to manifest terminal outcomes.

## Verification boundaries

The phase audit checks the closed state transitions, preserved successful and rejected evidence, interface-first export, the existing CLI boundary, syntax transpilation, the `collections.ts` one-newline invariant, and absence of the deleted relation foundation modules.

Syntax transpilation is not a strict TypeScript check. Full workspace type-check, focused tests, and PHP → CLI → manifest → generator end-to-end execution remain unverified in this workspace.

## Related PHP/Laravel modeling reference

PHP's official documentation describes interfaces as contracts for interchangeable implementations and type declarations as constraints on values at call boundaries. Laravel controller documentation models route-to-controller invocation as an explicit framework contract. RouteSync applies the analogous principle at its own boundary: source identity and rejected evidence are domain facts, not facts inferred from collection length or reconstructed downstream.
