# Phase 87.31 — Upstream Model/Dataflow Repair

## Trace

Laravel AST → verified SymbolTable → qualified semantic values → closed SemanticResolution ADT → BoundSemanticNode → downstream.

## Repairs

- Kernel and semantic conversion now consume the closed `SemanticResolution` ADT.
- Model variable resolution creates `ModelName` + `bound_model_reference`.
- `$this` uses only verified current model context.
- Assignment propagation reads ADT variants via exhaustive matching helper instead of legacy `type/model/resource` fields.
- ModelColumnResolver returns strict ADT directly, removing the legacy adapter at that boundary.
- Literal values are represented by `BoundLiteralValue` instead of raw primitive values.
- Unknown semantic states carry an explicit `BoundUnsupportedNode` reason.
- `selectRaw()` remains a separate projection boundary. It is not falsely mapped to a model column.

## Ecommerce-shop evidence

`ProductReview::updateOrCreate(...)` establishes `ProductReview` for `$review`; existing traced accesses such as `$review->rating`, `$review->title`, `$review->comment`, and `$review->is_verified_purchase` resolve through model-column evidence.

The `summary` assignment uses `selectRaw(... as avg_rating, ... as total_review)->first()`. Those aliases are query projection fields, not `ProductReview` columns. A dedicated projection ADT is therefore the next semantic boundary.

## Validation

A targeted TypeScript invocation was attempted. The repository snapshot has unrelated pre-existing type failures in broader domain modules and remaining legacy semantic plugins, so a green full build is not claimed.
