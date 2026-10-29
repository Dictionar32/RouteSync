# Phase 1376 — Route Capability Authority Composition

## Trace and decision

Route capability has two semantic responsibilities and therefore two related but distinct upstream contracts:

1. `routeCapabilityAuthorityAlgebra` resolves CRUD role and evidence from typed action/route facts.
2. `routeCapabilitySemanticAuthorityAlgebra` resolves hook, payload, content type, schema role, error responses, invalidation, and proof-carrying semantic output from typed `RouteCapabilitySemanticEvidence` plus explicit overrides.

The production authority objects are composed through `routeCapabilityAuthorityFactory.create(algebra)` and `createRouteCapabilitySemanticAuthority(algebra)`. These wrappers own the `authority: 'upstream'` and `closed: true` markers and delegate to the supplied algebra. They do not repeat classification or construct a second judgment.

The route boundary continues to adapt scanner facts into typed evidence and call the semantic authority. `RouteActionKind` remains the canonical ADT for mutability via `ROUTE_ACTION_KIND_REGISTRY`; no independent `isMutating` input is introduced. `RouteSchemaPayload.fields` remains the canonical source of request-field shape.

## End-to-end contract path

`Laravel route/controller/request/model/resource/schema evidence` → scanner typed boundary → `RouteCapabilityAuthorityAlgebraInterface` / `RouteCapabilitySemanticAuthorityAlgebraInterface` → upstream authority contract → closed route capability → projection/wiring → CLI and SDK generation / React endpoint hooks.

The AST/ADT path remains separate but connected: AST facts map to canonical `SemanticDataflowInput` and `SemanticDataflowJudgment`; the runtime adapter invokes the upstream dataflow authority; manifest forwards seeds/inputs; IR consumes closed dataflow closure; structural graph consumes structural semantic relations rather than pretending to be value dataflow.

## Validation

Run `npm run audit:phase1376-route-capability-authority-composition`, `node scripts/audit/semantic-ownership-coverage.cjs`, and `node scripts/audit/routesync-architecture.cjs`. These are static source-contract audits. A full build/typecheck/runtime test is a separate requirement and must not be claimed unless `tsdown` and project dependencies are installed.
