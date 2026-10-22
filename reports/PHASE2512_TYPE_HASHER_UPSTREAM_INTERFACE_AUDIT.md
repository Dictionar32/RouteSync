# RouteSync Phase2512 — TypeHasher Upstream Interface and Relation Cutover

## Scope

This change closes one concrete direct dependency in the active FormRequest type path: `compiler/types/TypeHasher.ts` no longer imports `semantic/relations` or relation-backed membership/index operations. Its operation is now explicitly typed by an upstream-owned `TypeHasherInterface`.

## Changes

- Added `packages/core/src/types/upstream/typeHasherInterface.ts`.
  - Owns `TypeHashEntry`, `TypeHashContext`, and `TypeHasherInterface`.
  - Defines the deterministic hashing operation contract at the upstream boundary.
- Updated `packages/core/src/compiler/types/TypeHasher.ts`.
  - `TypeHasher` is declared as `export const TypeHasher: TypeHasherInterface = Object.freeze(...)`.
  - Replaced direct relation helpers with native array operations for finalized lookup, cycle lookup, sequence rendering, uniqueness, and ordered hash members.
  - Preserved the existing `HashContext` type name as an alias to avoid an unnecessary consumer break.
- Exported the contract from `packages/core/src/types/upstream/index.ts`.
- Added `audit:phase2512-type-hasher-upstream-interface` to `package.json`.
- Added a repeatable structural audit at `scripts/audits/audit-phase2512-type-hasher-upstream-interface.cjs`.

## Verification

- Focused structural audit: **8/8 assertions passed**.
- Ran TypeScript 5.8.3 targeted compilation of `TypeHasher.ts` and its import graph. No diagnostics were reported for `TypeHasher.ts` or `typeHasherInterface.ts`, but the overall command fails due to pre-existing diagnostics in other files reached through the import graph. This is not a successful full typecheck.
- Full package build, Vitest, and CLI end-to-end were not run; the workspace has no installed `node_modules`.

## Known unresolved architecture debt

- `requestAstCanonical.ts` still directly imports `semantic/relations`.
- `operations/form-request/canonicalValidationRuleEntry.ts` and `ruleCollector.ts` still directly import `semantic/relations`.
- The TypeInterner dependency graph has not been proven transitively free of relations/foundation; this change only removes TypeHasher's direct imports.
- The active Laravel pipeline still imports legacy `subscanners` for response, schema, migration, DTO, query, service, middleware, and provider.
- The request producer input contract still needs an ownership review to ensure source evidence is upstream-owned without leaking parser implementation types.

## Architectural judgment

This phase closes one direct relation dependency and makes the hashing operation interface-first. It does **not** claim that the Laravel scanner is fully relation-free, foundation-free, or free of legacy subscanner dependencies. The next high-value migration remains the canonical FormRequest validation producer and its active consumers, with the upstream contract as authority and wiring changed only after the implementation contract is complete.
