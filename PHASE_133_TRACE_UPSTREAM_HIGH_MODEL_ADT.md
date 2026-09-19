# Phase 133 — Trace & Repair Upstream High-Model ADT

## Boundary

`ecommerce_shop source → scanner/parser → canonical upstream ADT/AST → complete data → downstream`

Downstream was not modified in this phase.

## Source evidence traced

- 19 Laravel models: casts, fillable/hidden/appends, custom tables, relations, accessors, constants and domain methods.
- 8 FormRequests: authorization, nested validation paths, `sometimes|required`, `required_with`, `exists`, `unique`, `in`, `array`, min/max and dynamic unique ignore.
- API routes: `Route::match`, route parameters, authenticated middleware groups and controller targets.
- Controllers/services/resources: query chains, collection transformations, null-safe access, coalesce, casts, array indexing, object/array literals, closures, conditional expressions, `match`, try/catch, transactions, redirects, JSON and downloads.
- Migrations: integer widths/sign, enum, nullable/default, unique/index and foreign-key delete semantics.

## Repairs

- Added named collection ADTs so domain interfaces do not expose free collection fields.
- Added explicit expression vocabulary for builtins, casts, binary operators, query operations, closures, indexing, arrays/objects and `match` arms.
- Added nested `PropertyPath` and `RelationPath` semantics.
- Added request authorization and structured validation targets.
- Added model schema, casts, constants, methods and accessor collections.
- Added database integer width, nullability, foreign-key actions and index vocabulary.
- Added route method/parameter/middleware collections and parameter constraints.
- Added exception type to catch handlers.
- Added assignment targets for receiver properties and indexed values.
- Added `RequestAst` and canonical `SourceAst` collection boundary.
- Manifest now consumes the canonical `SourceAst` boundary without a second schema copy.

## Verification

- Strict TypeScript check of `packages/core/src/types/upstream/index.ts`: PASS.
- Upstream files over 100 lines: 0.
- Forbidden canonical interface tokens (`any`, `unknown`, `null`, `undefined`, `?.`, `??`, `if`, `switch`, `Record<`): 0 matches.
- Direct free collection fields outside collection ADTs: 0.

## Remaining boundary work

The canonical model is substantially richer, but the legacy scanner is not yet fully wired into every canonical constructor. The next phase must trace each source category into these ADTs and prove that no semantic field is reconstructed downstream.
