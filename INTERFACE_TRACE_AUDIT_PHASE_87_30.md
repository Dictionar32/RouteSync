# Interface Trace Audit Phase 87.30

## Scope
Laravel AST -> EloquentMethodResolver -> strict SemanticResolution ADT -> BoundSemanticNode.

## Findings
The previous method boundary was strict in shape, but it still read PhpClassName/PhpMethodName as if they were strings. It also duplicated Eloquent method classification in a second registry, and instance methods collapsed unsupported return kinds into a scalar unknown. Query-builder chaining also discarded the verified ModelName when constructing the return type.

## Repair
- Read method/class identity from the closed PHP AST value objects at the AST boundary.
- Verify static model identity through `SymbolTable.get()` and carry the canonical model symbol name downstream.
- Use the single Eloquent registry for static and instance calls.
- Preserve `ModelName` as the source for `ReferenceType` construction.
- Produce scalar ADT only for explicitly registered scalar return kinds.
- Remove the array-to-unknown semantic shortcut from the resolved path; unsupported return kinds terminate as `unknown` with an explicit bound reason.
- Keep method identity in `MethodName` and method execution evidence in `bound_method_call`.

## Ecommerce-shop evidence
The ecommerce-shop manifest records `ProductReview::updateOrCreate(...)` as a model-producing operation and then resolves review fields through `ModelColumnResolver`. It also records chained `Payment::where(...)->with(...)->first()` and `Order::...->firstOrFail()` assignments. These are now fed through one strict Eloquent method registry instead of independent method classification paths.

## Remaining high-level boundary
`selectRaw(...)` remains intentionally unresolved as a synthetic query projection. Its SQL string is not semantic evidence until a dedicated SQL/query-projection AST is produced upstream. It must not be converted into `ProductReview` columns by guessing from the base model.

## Invariant
A method result may only become a semantic model/scalar when AST/context/registry evidence establishes that meaning. The resolver must never recover meaning from variable spelling, filenames, or a generic fallback string.
