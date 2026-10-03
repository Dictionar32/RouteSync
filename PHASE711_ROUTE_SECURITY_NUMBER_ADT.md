# Phase 711 — Route Security Number ADT Frontier

## Purpose

Close the DTS frontier exposed by `RouteSecurityResolver` without weakening the semantic AST/ADT architecture.

## Change

`RouteRateLimit.fixed.limit` is defined by the upstream route algebra as a `RateLimitDescriptor` whose numeric members are `NumberValue` ADTs. The resolver previously constructed raw host `number` values from `relationTextNumber`, producing a DTS mismatch.

The canonical numeric constructor is now `numberValue`, exported from `types/upstream/valueObjects.ts`, and `RouteSecurityResolver` constructs `maxAttempts` and `decayMinutes` through that ADT before constructing the fixed rate-limit relation.

No legacy request `resourceName` field was reintroduced.

## Validation

- Phase 709 diagnostic trace/suggestion ADT audit: PASS
- Phase 710 request/domain AST highest-interface audit: PASS
- Phase 711 route-security NumberValue ADT audit: PASS
- Phase 525 inactive-file vacuum: PASS (`candidates=[]`)

The extracted workspace does not contain a usable `tsup` binary, so a full `npm run build` cannot be executed inside this checkpoint environment. The exact reported DTS mismatch is eliminated structurally: `maxAttempts` and `decayMinutes` now have type `NumberValue` rather than raw `number`.

## Architectural direction

The resolver remains relational/declarative: source middleware evidence is normalized, classified into semantic policy/rate-limit relations, and lowered into the closed upstream route algebra. Primitive host values remain confined to boundary constructors rather than leaking into semantic interfaces.
