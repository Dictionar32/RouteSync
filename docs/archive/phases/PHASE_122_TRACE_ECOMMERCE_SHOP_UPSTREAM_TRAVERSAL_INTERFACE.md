# Phase 122 - ecommerce_shop upstream traversal interface

## Boundary

`ecommerce_shop source -> PHP AST -> ResourceExpressionModel -> ResourceBindingModel -> ResourceTraversalModel -> downstream`

## Source evidence

The actual ecommerce_shop resources contain nullsafe model traversal and resource collections, including PaymentResource, OrderResource, and ProdukItemResource. These forms require the upstream model to preserve receiver, member name, access mode, method arguments, and eventual model/cardinality information.

## Repair

Added `ResourceTraversalModel` as a high-level, pre-semantic traversal contract. It separates:

- traversal root
- model reference state
- property/relation/method step
- direct/nullsafe access
- method arguments
- target state
- cardinality
- resolved/unresolved/rejected resolution state

`ResourceBindingModel` now carries the traversal contract in addition to source, resolution, and provenance.

No SemanticType is introduced into this upstream contract. SemanticType remains downstream of model/symbol resolution.

## Invariant

Unknown model information is represented by an explicit ADT state. No fabricated model name is inserted. Method arguments remain embedded as `ResourceExpressionModel` values.

## Verification

Focused narrow TypeScript checking produced no diagnostics attributable to `resourceTraversalModel.ts` or the modified `resourceBindingModelFactory.ts`.

Full repository compilation is not claimed green because unrelated pre-existing diagnostics remain elsewhere in the workspace.

## Next upstream boundary

`ResourceTraversalModel -> Eloquent model surface -> property/relation/method resolution`.

The resolver must consume the scanned high-model Eloquent surface and populate source/target model, relation kind, and cardinality before the semantic layer is allowed to run.
