# Phase2365 — Resource Middleware Evidence Flow

- Changed `routeResourceMiddlewareRules` to consume the existing upstream `RouteDeclarationEvidence` instead of `RouteDeclarationAst`.
- Routed `RouteResourceRegistration.middleware` through the same evidence projection already supplied to `RouteProducerInput.declaration`.
- Added `scripts/audits/audit-phase2365-resource-middleware-evidence-flow.cjs`.
- No new interface, generic abstraction, or duplicate ADT was introduced.
- This phase does not claim that the scanner is a pure runtime executor; semantic-emission authority and `semantic/relations` / `subscanner` migration remain open.
