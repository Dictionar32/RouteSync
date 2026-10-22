# Phase 2131 — Canonical Schema Knowledge Boundary

## Trace finding

`ControllerActionContract.schema` is already a domain-level `RouteSchemaPayload`, built by `resolveSchema(request, body)` and `resolveActionSchema(request, body.schema)`. It is therefore suitable for publication as canonical action semantic knowledge without inventing another schema type. Its current derivation still belongs to the legacy resolver; this phase changes the knowledge boundary, not the derivation owner.

## Changes

- `LaravelControllerActionSemanticKnowledge` now publishes `schema: RouteSchemaPayload`.
- The action semantic judgment contract advances to version 8.
- Coverage now lists `schema` among published knowledge and leaves only `body` in the projection remainder.
- The production adapter publishes the existing resolved schema.
- Coverage explicitly states that schema is still derived by the legacy resolver and body remains in projection.
- Invocation correlation, runtime forwarding, and controller-wide integrated response ownership are unchanged.
- No duplicate foundation/relation layer or schema authority was added.

## Remaining debt

`resolveControllerActionContract()` still performs schema derivation. Body evidence and resolution also remain in the compiler projection. The next architectural step is to trace existing request-validation/schema authorities and migrate derivation ownership only if an existing authority semantically fits; do not merely move the resolver.

## Validation boundary

The Phase 2131 audit is a static source audit. TypeScript build, typecheck, and Vitest were not run.
