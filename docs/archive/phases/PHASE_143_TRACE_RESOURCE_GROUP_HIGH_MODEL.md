# Phase 143 — Trace ResourceGroup Higher Model

## Source truth
`ecommerce_shop` remains the Laravel source workspace; RouteSync consumes its classified route meaning.

## Trace
`ParsedRoute -> ResourceGroupDescriptor -> HookLowerer`

## Information loss found
`hookSourceLowerer` previously searched `group.all` with `show ?? index ?? first` to rediscover the primary route.

## Repair
Raised `primaryRoute` into the existing `ResourceGroupIdentityTrait` / `BaseResourceGroupDescriptor` model and populated it at the resource-group origin boundary.

`hookSourceLowerer` now consumes `group.primaryRoute` directly.

## Type signature repair
`resourceRouteGroupDescriptor.typeSignature()` no longer creates a role map and performs `get(role) ?? 'never'` lookups. Each classified resource-group variant supplies its already-resolved endpoint response types directly.

## Invariant
Downstream consumes semantic resource-group facts. It does not re-classify route roles or rediscover primary route semantics.

## Validation
Narrow TypeScript validation reaches only the pre-existing environment error:
`packages/core/src/compiler/utils/Hash.ts: Cannot find module 'crypto' or its corresponding type declarations.`
No new TypeScript error remains from the Phase 143 model changes.
