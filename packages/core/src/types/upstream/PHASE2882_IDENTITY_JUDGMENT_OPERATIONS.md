# Phase2882 — Identity Judgment Operations

## Scope

This phase continues the upstream-to-CLI manifest audit by strengthening an existing identity relation ADT and converting the source-project identity constructor to an interface-first runtime factory.

## Changes

- `SourceProjectIdentityRelationJudgment` variants now expose `continueWith` with domain-named `onSame` / `onDifferent` handlers.
- Inventory reasoning delegates project identity outcome handling to the relation judgment instead of switching on `relation.kind`.
- `createLaravelSourceProjectIdentity` is now a typed factory object with an explicit `.create(...)` operation; direct call sites in `packages` were migrated to that operation.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`CLI manifest composition -> createLaravelSourceProjectIdentity.create(...) -> source identity semantics -> SourceProjectIdentityRelationJudgment.continueWith(...) -> inventory project-binding judgment -> inventory closure -> manifest builder`.

## Remaining audit work

This is not a claim that all scanner runtime paths are free of `export function`, `map`, `flatMap`, `switch`, or primitive reasoning. Inventory completeness, source uniqueness, correspondence closure, and source-file identity still contain decisions that need separate domain-level review. Collection transforms are not removed mechanically.

## Verification boundary

The Phase2882 structural audit and TypeScript syntax parsing are run separately. Full typecheck, build, and end-to-end tests are not asserted unless executed in a dependency-complete workspace.
