# Phase 1402 — Runtime CRUD Slot Contract

## Problem traced

React's `resolveGroupSlots` and `resolveGroupExtras` scanned endpoint groups at runtime, then selected endpoints by `crudRole` and `targetScope`. This duplicated a projection decision that the CLI already had enough upstream route capability evidence to resolve. `resolveGroupQueryKeyFns` also fabricated `[groupName, 'list']` and `[groupName, 'detail', id]` keys when no query-key contract existed.

## Change

- `hookConfigLowerer.ts` emits `crudSlots`, a `crud_group_execution_contract`, using the upstream `crudRole`, `routeTargetScopeFromRoute`, and `routeParameterCapabilityReferenceFromRoute`.
- The contract carries direct endpoint references for index, show, create, update member, update collection, delete member, delete collection, and custom endpoints.
- React's slot resolver consumes this contract directly when present; it no longer needs to inspect roles or parameter metadata on that path.
- `defineHooks` consumes the explicit `createService` slot rather than assuming the endpoint action is literally named `create`.
- Synthetic query-key fallback arrays are removed. Query-key resolution must use supplied cache/query-key capability functions or fail explicitly.

## Remaining migration frontier

Hand-authored legacy hook configurations that omit `crudSlots` still use a compatibility path which scans `crudRole` and `targetScope`. This path is intentionally reported by the audit rather than claimed as eliminated. The generated CLI path is the canonical contract-first path; the next phase should migrate old hand-authored configurations and then remove the compatibility resolver.

## Architecture rule

Upstream resolves semantic role and route-parameter capability. CLI wiring lowers that result into direct references. React executes the wiring; it must not infer CRUD intent from method, action spelling, or path text. Runtime boundary checks remain valid when validating untrusted inputs, but must not become a second semantic authority.
