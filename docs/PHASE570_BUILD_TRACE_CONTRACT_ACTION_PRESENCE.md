# Phase 570 — Build Trace: Contract Action Presence Refinement

## Source trace

`build(6).log` shows ESM and CJS builds succeeding for core, sdk, react, and cli. The remaining DTS failure is:

`packages/core/src/compiler/generators/contract-generation/ContractActionGenerator.ts(57,57)`

The field name was already refined to `PropertyName` in Phase 569. The new failure is that `presence` is still a raw `boolean`, while `ResolvedProperty.presence` requires the semantic `Presence` vocabulary (`required | optional | unspecified`).

## Fix

`ContractActionGenerator` now converts `ActionField.required` through the canonical relational decision operator:

`boolean required -> relationResolve -> { kind: 'required' | 'optional' }`

No widening of `ResolvedProperty.presence` was performed. The semantic boundary remains nominal and relation-driven.

## Verification

The checkpoint environment does not contain `node_modules`, so the complete `npm run build` cannot be rerun here. Static source verification confirms:

- `presence: f.required` is removed from `ContractActionGenerator.ts`.
- `relationResolve` is imported from the canonical semantic relational kernel.
- both branches construct the canonical `Presence` vocabulary.
- no `undefined`, ternary, imperative loop, or host fallback was introduced by this fix.

The authoritative next step is to run `npm run build 2>&1 | tee build.log` from the project environment and continue from the first new DTS error.
