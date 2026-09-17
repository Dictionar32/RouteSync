# RouteSync Interface Trace Audit — Phase 87.31

## Scope

Laravel AST → SemanticResolutionKernel → variable/model/column/accessor resolution.

## Repair

1. `SemanticResolution` is consumed from the closed ADT domain module.
2. `semanticResolutionToBoundType` uses exhaustive `matchSemanticResolution`.
3. Kernel unknown paths create `BoundUnsupportedNode` through one support boundary.
4. Variable model resolution creates `ModelName` and `BoundModelReferenceNode`.
5. `$this` uses verified current model identity and no filename inference.
6. Assignment tracing consumes ADT variants through `resolutionLabel`; it does not read legacy `type/model/resource` fields.
7. `ModelColumnResolver` returns the strict ADT directly and no longer converts to the legacy contract.
8. Primitive literals are represented as qualified `BoundLiteralValue` ADT values.
9. PHP cast kind is read from the AST discriminator, not from a synthetic string property.

## Ecommerce-shop trace

`ProductReview::updateOrCreate(...)` remains the source of model identity for `$review`. Existing manifest evidence resolves `$review->rating`, `$review->title`, `$review->comment`, and `$review->is_verified_purchase` through `ProductReview` column evidence.

`ProductReview::where(...)->selectRaw(...)->first()` is intentionally not converted into a `ProductReview` column source. Its aliases `avg_rating` and `total_review` are query projection data and require a dedicated projection ADT.

## Invariants

- No variable-name → model inference.
- No filename → model inference.
- No collection inference from plural spelling.
- No unknown → scalar coercion.
- No legacy semantic field construction at repaired boundaries.
- Query projection identity remains upstream of `ModelColumnResolver`.
