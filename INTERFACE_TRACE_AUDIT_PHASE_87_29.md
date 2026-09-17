# Interface Trace Audit Phase 87.29

## Scope
Ecommerce-shop Laravel AST -> EloquentMethodResolver -> strict SemanticResolution ADT -> BoundSemanticNode.

## Trace finding
The previous phase introduced model/resource bound identity, but Eloquent method producers still imported the legacy SemanticResolution contract. Static and instance method resolvers reconstructed free-form `type/model/collection/paginated` values.

## Repair
- EloquentMethodResolver now exposes only the strict SemanticResolution ADT.
- Static Eloquent calls require a verified symbol-table model before producing a model resolution.
- Method identity is carried by `ModelName` and `MethodName` value objects.
- Every resolved method result carries a `bound_method_call` node.
- Cardinality comes from the Eloquent registry, not variable spelling.
- Unknown method/target cases carry an explicit unsupported reason.
- semantic/types.ts now points its kernel contract at the strict ADT.

## Ecommerce-shop evidence
`ProductReview::updateOrCreate(...)` is already traced as a model-producing Eloquent operation, and `$review->rating`, `$review->title`, `$review->comment`, and `$review->is_verified_purchase` are subsequently resolved through `ModelColumnResolver`. The source manifest records the assignment and these traces as upstream evidence.

`Payment::where(...)->with(...)->first()` and `Order::...->firstOrFail()` are represented as assignments in the ecommerce-shop manifest. The strict method boundary now gives these operations a typed model identity instead of a free-form `type: 'model'` object.

## Remaining migration
Legacy imports remain in ResourceGraphResolver, FrameworkRegistryResolver, PrimitiveResolver, ExpressionResolver, MethodReturnResolver, AccessorResolver, VariableResolver, ConditionalWrapperResolver, expression handlers, variable handlers, ModelColumnResolver adapter, kernel/contextBuilder, and modelNodes. These are intentionally the next compile-driven migration targets.

## Invariant
No downstream stage may infer model identity from a variable name, filename, or collection spelling. Semantic meaning must originate from verified AST/context/registry evidence and cross the boundary as a closed ADT.
