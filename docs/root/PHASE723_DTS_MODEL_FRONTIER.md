# Phase 723 — DTS model frontier repair

## Build frontier

The Phase 722 build reached DTS generation and failed at three structural points:

1. `cacheInvalidation.ts`: `Object.freeze` widened `StringValue.kind` inside registry callbacks to `string`.
2. `resourceModelMethodSurface.ts`: duplicate `SemanticType` and `ResourceTraversalCardinality` imports.
3. `crudRoles.ts`: duplicate type re-export of `CrudRole` and `RouteHookKind`.

## Repairs

### 1. Semantic value witness, not a free object literal

`SemanticValueFactory.stringValue` is now exported as the canonical constructor for `StringValue`.
The invalidation registry uses this semantic constructor and is checked with `satisfies InvalidationTargetRegistry`.

This preserves the mapped registry as the ADT authority instead of fixing the error with a cast.

### 2. Single import authority

`resourceModelMethodSurface.ts` now has exactly one import authority for `SemanticType` and one for `ResourceTraversalCardinality`.
`ModelName` was removed because it is not part of the surface.

### 3. Single route vocabulary authority

`crudRoles.ts` no longer imports and then separately type-re-exports the same `CrudRole` / `RouteHookKind` identifiers.
The upstream route execution vocabulary remains the authority.

## Laravel/ecommerce-shop upstream trace

The concrete `examples/ecommerce-shop-source` resource files provide the semantic vocabulary that the resource AST already models:

- `OrderResource`: relation projections (`shipping`, `promotion`, `financial`, `fulfillment`, `amount`), nullsafe access, null-coalescing fallbacks, casts, nested object output, and resource collections.
- `PaymentResource`: nested relation traversal (`order -> promotion`, `paymentDetail -> detail`), array-like gateway extraction, resource collection output, and `whenLoaded` presence semantics.
- `ProdukItemResource`: relation traversal (`frontend`, `category`), conditional expression, casts, and scalar projections.

The canonical upstream resource model already contains `ResourceFieldOutput`, `ResourceFieldPresence`, `ResourceTransformation`, `ResourceRepresentation`, and related closed semantic variants. The next resource frontier should therefore consume those upstream judgments rather than create another parsed descriptor model.

## Validation

The Phase 723 audit passes. A repository-wide TypeScript compile cannot be claimed from the stripped checkpoint because its dependency type libraries are absent. The user's real `npm run build` remains the authoritative validation for the DTS frontier.
