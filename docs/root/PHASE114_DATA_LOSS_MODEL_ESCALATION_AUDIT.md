# Phase 114 — Data-Loss & Syntax-Model Escalation Audit

## Scope
Audit dilanjutkan dari Phase 113 untuk memastikan pengetahuan Laravel/syntax tidak turun menjadi parser control flow, sementara traversal arithmetic tetap berada di syntax-navigation primitives.

## External architecture check
- Tree-sitter documents named fields as the mechanism for accessing syntax children by semantic name instead of ordered position.
- Tree-sitter's navigation API exposes named children/siblings and field-based access; this supports keeping positional arithmetic inside a navigation abstraction.
- Laravel 13 routing documents route groups, middleware arrays, `where` constraints, and resource middleware such as `middlewareFor` / `withoutMiddlewareFor` as structured route semantics.

## Implemented escalation
1. Route invocation recognition moved to `routeInvocationMethod`.
2. Nested group merging moved to `mergeRouteGroupStates`.
3. Group property vocabulary and binding-scope vocabulary remain declarative catalogs.
4. Route target shape recognition moved to `routeTargetDescription`.
5. Resource middleware empty-result handling no longer uses an `if` guard in the AST constructor.
6. Removed all nullish-coalescing syntax from the audited route AST surface; absence remains explicit through typed `undefined`/presence models.
7. Existing `TokenCursor` and `delimiterNavigation` remain the only owners of positional arithmetic.

## Static audit
- `??`: 0
- semantic numeric `[0]` / `[1]`: 0
- `indexOf` / `findIndex`: 0
- raw identifier ± integer arithmetic: 10, all confined to `tokenCursor.ts` and `delimiterNavigation.ts` (plus the route-binding regex text, which is not traversal arithmetic)
- `if/switch/while` in `routeSyntaxModel.ts`: 0
- temporary/backup files: 0
- routeAst TypeScript transpilation: PASS

## Interpretation of remaining control flow
The remaining `if`/`while` in parser/navigation code are execution/absence mechanics: scanning until end, advancing after an unsuccessful candidate, validating optional AST shapes, and maintaining delimiter state. They are not Laravel vocabulary tables or positional knowledge. Domain choices continue to be represented by typed catalogs, relations, and syntax facts.

## Data-loss guard
No first-element extraction was introduced. Multi-value route methods, resource middleware actions/middleware, and constraint values continue to preserve their complete argument collections.
