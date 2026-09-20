# Phase 34 — Lookup Boundaries / Model / Zod / Request Interface

Scope: interface repair only. Downstream implementation was intentionally not migrated.

## Trace

Cross-boundary trace found semantic lookup leakage in:
- `types/semantic/modelGraphTypes.ts`: model casts exposed `get(): string | undefined` and `getCast()` duplicate lookup vocabulary.
- `types/semantic/zodAstTypes.ts`: Zod object shape exposed `get(): ZodAST | undefined`, making consumers reconstruct property presence.
- `types/domain/requestModels.ts`: headers used `get(): string` with `''` as a missing sentinel.

## Repair

- Model cast lookup now exposes canonical `Lookup<ModelCastEntry>`.
- Model cast entries use typed `ColumnName` and `CastType`.
- Model column semantic is correlated as `native | casted`, preventing separate cast/type interpretation.
- Zod properties use typed `PropertyName` and `Lookup<ZodPropertyEntry>`.
- Request headers expose `lookup()` with `Lookup<HeaderDeclaration>` instead of `''` missing sentinel.
- Existing `Lookup<T>` from `upstream/collections.ts` remains the canonical absence ADT.

## Intentional consequences

Existing consumers calling `get()` / `getCast()` or expecting primitive strings will fail until their upstream boundary is migrated. This is intentional. The interface is not weakened to make compilation green.

## Verification

The canonical upstream vocabulary remains free of implementation absence tokens (`null`, `undefined`, `any`, `Record<`, `?.`, `??`). Semantic words such as `nullable` and PHP nullsafe expression kinds remain valid domain vocabulary.
