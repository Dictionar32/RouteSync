# Phase 132 — Trace Upstream ADT Completeness

## Boundary
`ecommerce_shop source -> PHP AST -> canonical upstream ADT -> manifest -> downstream`

Downstream is intentionally untouched.

## Source findings
- 19 Eloquent models are present.
- Model surface includes `$fillable`, `$hidden`, `$appends`, `$casts`, custom `$table`, relations, computed accessors, `Attribute` accessors, constants, and domain methods.
- Request surface has 8 FormRequests.
- Validation uses `sometimes|required`, `required_with`, `array`, `exists`, `unique`, `in`, `min`, `max`, `email`, `nullable`, `string`, and `integer`.
- `UpdateProfileRequest` contains a dynamic `Rule::unique(...)->ignore(...)` expression.
- Routes use `Route::match`, controller targets, route parameters, and inherited middleware groups.
- Controllers use conditionals, foreach, transactions, try/catch, abort, redirects, JSON responses, downloads, and query/mutation chains.
- Resources/controllers use null-safe and coalesce expressions; these must be represented upstream, never repaired downstream.
- Migrations use nullable columns, defaults, enums, unique/index constraints, foreign keys, and delete/update actions.

## Interface repairs
- Added closed primitive/name/value-object vocabulary.
- Added source provenance spans.
- Added property origin and semantic value algebra.
- Added receiver-aware expression/query vocabulary.
- Added assignment algebra.
- Added model behavior/exposure/relations/accessors/constants/methods.
- Added request authorization and validation semantics, including nested dependency rules and unique-ignore expressions.
- Added resource response variants.
- Added response payload/wrapper semantics.
- Added route method, authentication, middleware, and path-parameter ADTs.
- Added controller statement algebra.
- Added explicit `RequestAst` wrapper to prevent request-definition leakage.
- Added database schema vocabulary.
- Added manifest boundary over one canonical `SourceAst`.

## Verification
- Canonical upstream files: 18.
- Every canonical upstream file is below 100 lines.
- TypeScript strict typecheck of `types/upstream/index.ts`: PASS.
- Forbidden interface scan for `any`, `unknown`, `null`, `undefined`, `?.`, `??`, `if`, `switch`, `Record<`: 0 matches.

## Remaining boundary work
- Wire scanner/parser outputs into these ADTs.
- Trace all model relation key overrides and migration foreign-key actions into the canonical schema model.
- Add exact exception identity/catch semantics where source requires it.
- Trace every resource/controller expression into the expression algebra.
- Build the manifest only from canonical AST nodes.
- Only after those checks should downstream lowering be re-enabled.
