# Interface Trace Audit Phase 87.28

## Scope
Laravel AST -> semantic variable resolution -> strict domain ADT -> downstream IR.

## Upstream defects repaired

1. `VariableResolver/modelNameResolver` previously inferred model identity and collection cardinality from variable spelling:
   - plural -> singular
   - capitalized variants
   - compound suffix matching
   - `collection: true` derived from the variable name

   A variable name is syntax, not proof of runtime cardinality. This created free semantic data at the resolver boundary.

2. `thisResolver` previously derived model identity from `context.fileName` when the model context was absent. A filename is source metadata and must not become semantic model identity by fallback.

## New invariant

```text
Laravel AST
  -> explicit assignment / model context
  -> semantic resolution
  -> qualified ModelName / BoundModelReference
  -> IR
```

Unknown context stays unknown. No singularization, suffix guessing, filename guessing, or fabricated collection semantics are introduced by the variable resolver.

## Ecommerce-shop impact

Existing explicit assignment evidence remains authoritative. For example, a variable resolved from an Eloquent model-producing assignment can carry its model identity downstream. The resolver no longer tries to manufacture equivalent meaning merely from a variable spelling.

## Remaining migration

The next upstream producers are `PrimitiveResolver`, `AccessorResolver`, `EloquentMethodResolver`, `MethodReturnResolver`, and `ExpressionResolver`. They still contain legacy semantic construction and must be migrated to the closed `SemanticResolution` ADT before the legacy contract can be deleted.
