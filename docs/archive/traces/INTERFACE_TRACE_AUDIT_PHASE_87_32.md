# Interface Trace Audit Phase 87.32

## Scope
Laravel AST semantic producers to strict SemanticResolution and bound semantic types.

## Repairs
- Variable model lookup now uses exact verified SymbolTable identity, not case-insensitive inference.
- ExpressionResolver imports the canonical strict SemanticResolution ADT and routes unsupported kinds through bound unsupported nodes.
- Literal resolution now creates a BoundPrimitiveNode and strict scalar resolution. Primitive JS values are carried only as qualified BoundLiteralValue variants.
- SemanticResolution-to-SemanticType conversion preserves object structure using ObjectType instead of collapsing object resolutions to PrimitiveKind.UNKNOWN.

## Ecommerce-shop evidence
`ProductReview::updateOrCreate(...)` is a model-producing assignment and its downstream `rating`, `title`, `comment`, `is_verified_purchase`, and `created_at` accesses have model-column evidence. The `summary` assignment uses `selectRaw(... as avg_rating, ... as total_review)` and must remain a projection/object concern rather than being guessed as a ProductReview column.

## Invariants
1. Model identity comes from verified symbol evidence.
2. Unknown is never converted into a model by variable spelling.
3. Literal strings/numbers/booleans are represented as qualified BoundLiteralValue variants.
4. Object semantic information is not discarded during type conversion.
5. `selectRaw` projection semantics remain an upstream follow-up and are not fabricated by accessors.

## Validation
The supplied snapshot has no root or core `tsconfig.json`, so full TypeScript compilation cannot be claimed. ZIP integrity was verified after packaging.
