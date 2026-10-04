# Phase 806 — Route Group Fold Type Frontier

## Frontier
`routeDeclarationParser.ts` was consuming the canonical upstream `RouteConstraintArgument` closed ADT through `relationVariantFold`, but TypeScript inferred the nested fold result from the `none` branch alone. The DTS frontier therefore narrowed the whole fold to `{ kind: 'none' }` and rejected the `values` and `pattern` branches.

## Elevation
The consumer now declares the fold result as the canonical AST ADT `RouteConstraintArgumentAst` at both fold levels. The upstream semantic input remains `RouteConstraintArgument`; no free string/primitive data flow or legacy parsed descriptor is introduced.

## Invariant
- upstream closed ADT remains the semantic source of truth;
- AST is a projection of the upstream ADT, not a second semantic authority;
- both variant folds have an explicit closed result type;
- no dead callback parameter is introduced.

## Validation
- Phase 806 static audit: PASS.
- Full `npm run build` could not execute in the sandbox because `tsup` is not installed there. The user's local build is the authoritative validation.
