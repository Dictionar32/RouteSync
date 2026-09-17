# Interface / Trace Audit Phase 87.33

## Target

Repair the Laravel semantic flow around the `ecommerce-shop` review summary so a query projection is an explicit upstream ADT instead of collapsing into `unknown` and forcing downstream property access to guess.

## Concrete source evidence

The traced Laravel assignment is:

`ProductReview::where('produk_item_id', $produkId)->selectRaw('COALESCE(ROUND(AVG(rating), 2), 0) as avg_rating, COUNT(*) as total_review')->first()`

The response subsequently reads `$summary->avg_rating` and `$summary->total_review`. The previous trace showed `first()` falling through to `unknown`, followed by property access failure. The trace also showed ordinary `$review` model-column accesses resolving from `ProductReview::updateOrCreate(...)` through `ModelColumnResolver`.

## Repair

1. Added `QueryProjectionSemanticResolution` as a closed semantic variant.
2. Added `BoundQueryProjectionNode` and `BoundProjectionFieldNode` to the bound semantic AST.
3. Added `responseFieldName()` to `SemanticValueFactory` so projection aliases are qualified values.
4. Added `SelectRawProjectionResolver` plus a small deterministic projection parser. It recognizes only explicit `AS alias` projection fields and aggregate numeric expressions. It does not infer fields from the base model.
5. `selectRaw()` now produces the projection ADT from a verified model target.
6. `first()` preserves a verified query projection as an object with the declared projection fields.
7. Property access resolves declared structured fields directly from the upstream object/projection contract. It does not retry model-column lookup for a projection.
8. Binary `??` handling was moved to the strict semantic ADT path so `$summary->total_review ?? 0` can preserve the scalar type without legacy `{ type: string }` objects.
9. Fixed an existing syntax corruption in `literalTernaryBinders.ts` (`resultingType: trueBranch.descriptor.semanticType,Branch...`) exposed by the TypeScript parse check.

## Invariants

- Model identity comes from verified symbol evidence.
- Projection identity comes from explicit `selectRaw` aliases, not variable spelling or base-model columns.
- Query projection survives `selectRaw -> first -> property access`.
- Structured field access consumes upstream field declarations.
- Unknown is represented by the closed `unknown` ADT with a bound unsupported reason, never by an untyped object.
- No `as any`, optional chaining, or nullish fallback was introduced by this phase.
- The projection parser uses character scanning rather than regular-expression inference.

## Validation

A temporary strict TypeScript check was run against the touched semantic/domain files. No diagnostics were reported for the touched projection, property-access, binary-expression, semantic-resolution, bound-AST, or factory files. The repository as a whole still has pre-existing compilation errors and missing external dependencies in the snapshot, so a full repository build is not claimed.

ZIP integrity was checked with `unzip -t`.
