# Phase Upstream Interface Repair 23 — Absence / Lookup Vocabulary

Date: 2026-09-19

## Scope

Interface-only repair. No downstream implementation rewrite.

## Trace result

`packages/core/src/types/upstream/**/*.ts` contains no JavaScript `if`, `null`, `undefined`, optional property, `?.`, or `??` patterns in the canonical upstream interfaces.

The remaining re-classification occurs at consumers that use lookup APIs returning `T | undefined`, especially semantic/domain collection maps.

## Root cause

Absence was represented implicitly by JavaScript collection APIs (`Map.get() -> T | undefined`). This forces consumers to branch on `undefined` and reconstruct semantic state.

## Repair

Added canonical upstream absence vocabulary in `types/upstream/collections.ts`:

- `Option<T> = none | some(value)`
- `Lookup<T> = missing | found(value)`

Exported both from `types/upstream/index.ts`.

These are semantic contracts; they do not use `null` or `undefined`.

## Next interface migration

Existing semantic/domain collection interfaces exposing `get(...): T | undefined` must migrate to the canonical `Lookup<T>` boundary. This is intentionally not implemented in this phase because the current instruction is interface-first.

## Important distinction

Semantic variants such as `nullable`, `nullsafe_property`, and literal-null expression nodes are legitimate domain meaning and are NOT JavaScript null leakage.

## Verification

Canonical upstream scan remains free of `if`, `null`, `undefined`, `?.`, and `??`.
