# Phase 770 — Highest Route Capability ADT + Laravel Ecommerce Dataflow Frontier

## Build frontier

The authoritative DTS failure was:

- `RouteCapabilityContract.middleware` requires `RouteMiddlewares`.
- The boundary still supplied `readonly PropertyName[]`.

This phase raises the resolved boundary to the upstream route algebra instead of casting the array.

## Model elevation

- `ResolvedRouteBoundaryOptions.middleware` is now `RouteMiddlewares`.
- The authoring/scanner perimeter may still carry `PropertyName[]`; the boundary adapter converts those names into canonical `MiddlewareName` and `RouteMiddleware.direct` facts.
- `RouteSecurityResolver` consumes `RouteMiddlewares` and emits `Sequence<RoutePolicyDescriptor>`.
- `RouteCapabilityContract` receives canonical middleware, policy sequence, invalidation sequences, and upstream `HttpErrorResponse` values.
- Domain HTTP error descriptors are translated once at the boundary through `toUpstreamHttpErrorResponse`; no second security descriptor is introduced.
- `emitStandardRoutes` uses `relationVariantFold` for the closed target ADT instead of host-style narrowing.
- The stale capability input type is now an explicit closed boundary input rather than a union of optional `Pick` shapes.

## Security authority rule

`RouteSecurityDescriptor` remains the single security ADT authority.

No `CanonicalRouteSecurityDescriptor`, `ParsedRouteSecurityDescriptor`, `ResolvedRouteSecurityDescriptor`, `RouteSemanticFlowSecurityDescriptor`, or `ScannedRouteSecurityParams` is introduced.

## Ecommerce source workload

The Laravel workload under `examples/ecommerce-shop-source` provides concrete semantic evidence:

- public routes: categories, products, product reviews, authentication, payment webhook;
- authenticated routes: profile, orders, cart, checkout, buy-now, wishlist, payment and invoice;
- admin route: authenticated + `admin` middleware;
- domain models include `ProdukItem`, `Order`, `OrderDetail`, `Payment`, `Category`, `ProductReview`, `PromoCode`, and shipping/payment projections.

The semantic layer should represent these through relations rather than parsed descriptors. The target relation vocabulary is:

`model_declares_entity`, `model_declares_property`, `model_declares_relation`, `route_reads_property`, `route_writes_property`, `request_binds_field`, `request_requires_field`, `cart_contains_product`, `order_contains_item`, `order_has_customer`, `resource_projects_property`, `target_projects_route`.

## Research alignment

The architecture direction follows the useful parts of established compiler/rewriting systems:

- WebAssembly specifies validity as declarative typing constraints and separately sketches a sound/complete validation algorithm.
- MLIR PDLL separates matching from rewriting and treats patterns as declarative rewrite specifications.
- MLIR PDL represents matcher/rewrite structure as IR, enabling the pattern infrastructure itself to be transformed and verified.
- CompCert makes semantic preservation an explicit compiler correctness criterion.
- Spoofax separates declarative syntax, static semantics/name binding, and term transformation.
- CIRCT demonstrates MLIR-style multi-level IR infrastructure for a different source/target domain.

RouteSync applies the same separation to Laravel-to-Next routing: scanner evidence -> closed AST/upstream facts -> semantic relations -> fixed-point/rewrite closure -> target projection.

## Inactive file vacuum

Files proven unreferenced by the active core export/import surface and representing superseded authority were emptied rather than retained as compatibility reservoirs. Parsed-AST reservoirs and the legacy semantic-resolution adapter remain empty.
