# Phase 52 — Downstream-Dumb Model Surface

## Scope
Whole `packages/core/src`, excluding legacy `packages/core/src/compiler.ts`.

## Trace finding
`ResourceModelSurface` was still re-classifying model members:
- property lookup searched the mixed member index and then inspected `kind` to derive semantic type;
- relation lookup searched the same mixed index and then checked `kind === relation`;
- column/accessor semantic members exposed `type`, while relations exposed `semanticType`.

This forced downstream consumers to rediscover semantic category/type.

## Interface repair
- `ModelSemanticColumn` now exposes `semanticType` alongside its existing `type` during migration.
- `ModelSemanticAccessor` now exposes `semanticType` alongside its existing `type`.
- `ModelSemanticSurface` now exposes a dedicated `relationsByName` index.
- `ResourceModelSurface.resolveProperty()` consumes the already correlated `semanticType` instead of branching on `member.kind` to derive it.
- `ResourceModelSurface.resolveRelation()` consumes `relationsByName` instead of searching the general property index first.
- `ModelSemanticPropertyIndex.get()` was not restored. Existing consumer errors are intentional migration signals; adding a compatibility `get(): T | undefined` would lower the interface again.

## Important boundary
This phase does NOT remove every `if`/`switch` from core. Parser/lexer/origin construction may legitimately branch. The target is semantic re-classification in downstream consumers.

## Verification
Narrow TypeScript check reports migration errors in existing consumers of the old `.get()` API and one legacy `ModelSemanticSurface` constructor. No compatibility fallback/cast was added to hide them.

Legacy `packages/core/src/compiler.ts` remains excluded.
