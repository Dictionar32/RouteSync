# Interface Trace Audit Phase 85

## Scope
PHP AST ADT only. Producer/consumer flow is intentionally not migrated.

## Trace evidence
The ecommerce_shop manifest records closure and arrow-function source in controller assignments, including `function ($query) use ($request)` and `fn($q) => ...`. The AST must preserve these binding facts instead of reducing a closure/arrow function to only its body.

## Changes
- `ClosureAstNode` now carries `parameters` and `captures`.
- `ArrowFuncAstNode` now carries `parameters`.
- Closure captures distinguish by-value and by-reference.
- `UnsupportedAstReason` is now a discriminated ADT.
- AST dispatch avoids explicit `as any` in the algebra boundary.

## Invariant
No closure binding information is discarded at the PHP AST boundary.

## Deferred
Parser/scanner constructors and downstream consumers remain unchanged by design. Compile failures identify the migration surface.
