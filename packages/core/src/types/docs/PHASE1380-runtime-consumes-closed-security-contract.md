# Phase 1380 — Runtime Consumes the Closed Security Contract

## Trace finding

Phase 1379 closed the `RouteSecurityJudgment` result type, but two consumers still invoked `routeSecurityAuthority.resolve(...)` themselves: `buildRouteCapabilityContract` and `resolveResolverGraphJudgment`. That meant these composition/runtime-facing layers still accepted raw middleware/auth facts and triggered semantic reasoning instead of consuming a completed judgment.

## Contract evolution and wiring

- `ResolvedRouteBoundaryOptions.security` now carries `RouteSecurityJudgment`.
- `resolveRouteBoundaryInput` is the upstream boundary where middleware/auth source facts are resolved into the canonical security judgment.
- `buildRouteCapabilityContract` consumes `params.security`; it no longer calls the security authority.
- `ResolverGraphInput` now requires `security: RouteSecurityResolution` and no longer accepts raw middleware/auth fields for security resolution.
- `resolveResolverGraphJudgment` projects the supplied judgment and does not call the authority.

Flow: raw route evidence → boundary input resolution → `RouteSecurityJudgment` → capability/graph composition → downstream projections.

## Validation limits

The new audit verifies that the two consumers accept and forward the closed judgment and do not import/call `routeSecurityAuthority`. Existing Phase 1378 and 1379 audits are also run. A static audit does not substitute for TypeScript compilation. The project build remains unverified if `tsdown`/dependencies are unavailable in the workspace.
