# Phase 1315 — Schema-role evidence contract

Date: 2026-10-08

## Finding
Phase 1314 removed SDK-side schema-role classification but still derived the role from `hookKind` in upstream authority. That violated facet independence: execution kind is not schema ownership evidence. The route capability builder also needed explicit facet conservation.

## Change
- Added optional explicit `schemaRole` evidence to the scanner boundary.
- Upstream authority uses explicit schema-role evidence when present; absent evidence defaults to `request` because the scanner `RouteSchemaPayload` represents Laravel request-validation rules.
- A `response` role must be supplied explicitly by a boundary with response-schema evidence.
- Preserved `schemaRole` through capability overrides, resolved boundary data, the closed route capability builder, route declaration, CLI emission, and SDK consumption.
- Added regression checks that forbid deriving `schemaRole` from `hookKind`.
- Updated `Engine.Fix.md` and added `audit:phase1315-schema-role-contract-evidence` without removing existing package scripts.

## Architecture
`source evidence → upstream semantic authority → closed capability contract → boundary wiring → CLI projection → SDK/React consumers`.

`hookKind`, `schemaRole`, and `payloadLocation` are independent semantic facets. `DataFlowInterface` remains generic; domain-specific reasoning stays in `SemanticDataflowInterface`/upstream authority; wiring preserves the exact upstream judgment and proof.

## Remaining
`routePayloadLocationFromMethod` remains an upstream default policy and should be revisited with explicit request-binding/schema evidence. Full build is only considered verified if the repository's configured build tool completes successfully.
