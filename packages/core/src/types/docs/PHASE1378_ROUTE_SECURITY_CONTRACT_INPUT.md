# Phase 1378 — Route Security Contract Input

## Trace (upstream first)

`RouteMiddlewares` + `TruthValue`
→ `RouteSecurityAuthorityInput` (discriminated request ADT)
→ `RouteSecurityAuthorityAlgebraInterface.resolve(input)`
→ canonical `routeSecurityAuthorityAlgebra`
→ `RouteSecurityAuthorityContractInterface` (`authority: 'upstream'`, `contractVersion: 'route_security.v1'`, `closed: true`)
→ scanner capability builder / resolver graph / domain facade
→ projected security capability.

## Contract evolution

The authority previously accepted middleware and auth as separate positional arguments. That signature left the contract boundary implicit and made future input evolution harder. The interface now takes one named, discriminated `RouteSecurityAuthorityInput`, with required middleware and auth evidence. The closed authority carries an explicit contract version. The authority wrapper only delegates to the injected algebra; it does not classify or reinterpret middleware.

The deprecated `RouteSecurityResolver` remains a compatibility facade for existing consumers and converts its legacy arguments into the canonical request ADT. Core consumers use the ADT directly. The security/policy algorithm and the `RouteSecurityResolution` projection are unchanged in this phase.

## Validation

Run `npm run audit:phase1378-route-security-contract-input` to check the contract declaration, authority delegation, public export, and wired core consumers. This is a static source audit, not a substitute for TypeScript compilation or runtime tests.
