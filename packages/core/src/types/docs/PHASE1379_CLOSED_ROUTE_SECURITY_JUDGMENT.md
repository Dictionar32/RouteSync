# Phase 1379 — Closed Route Security Judgment

## Intent

Runtime must execute a completed upstream contract, not consume a partial result and infer whether it is complete. Phase 1378 improved the request boundary, but its result type (`RouteSecurityResolution`) still exposed only the payload fields and did not encode that the result was a closed upstream judgment.

## Contract evolution

`RouteSecurityJudgment` is now the authoritative result ADT. It requires:

- `kind: 'route_security_judgment'` as a discriminant;
- `authority: 'upstream'` and `contractVersion: 'route_security.v1'`;
- `closed: true`;
- resolved `security`, `auth`, `policies`, and `rateLimit` fields.

`RouteSecurityResolution` remains as a compatibility alias to the full judgment, so existing consumers retain their import name without retaining a partial result shape. The upstream resolver constructs the closed judgment; adapters and downstream consumers delegate to the authority and do not perform security classification.

## Actual wiring traced

`RouteSecurityAuthorityInput` → `RouteSecurityAuthorityAlgebraInterface.resolve` → canonical upstream reasoning → `RouteSecurityJudgment` → `routeSecurityAuthority` → scanner resolver graph / capability builder / compatibility facade.

## Validation boundary

The Phase 1379 audit checks the declared ADT, mandatory closure metadata, output construction, public export, and consumer delegation. It is a source-structure audit, not a substitute for `tsc`, build, or runtime tests. TypeScript's discriminated unions and exhaustiveness checks support this pattern, but TypeScript types are erased at runtime; untrusted serialized inputs still need runtime validation.
