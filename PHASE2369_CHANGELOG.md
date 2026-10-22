# Phase2369 — Resource Flow Contract Evolution

## Contract changes

- Evolved the existing `RouteResourceActionPlan` to carry `runtimePath` and `constantKey` alongside the planned route path and parameter names.
- Evolved `RouteResourceFlowJudgment` and `RouteResourceFlowAuthority` to contract version 2.
- Moved `deriveRouteConstantKey` to the upstream `names.ts` module beside the canonical `RoutePath` value constructors; existing boundary and route-path consumers now import the upstream-owned operation.
- Removed direct `semantic/relations` imports from `routeResourceFlow.ts`; the existing authority evaluates its existing declarative action/name knowledge without depending on that module.
- The active scanner's resource branch now sends the raw declaration path and group prefix to `RouteResourceFlowAuthority`; it no longer invokes `resolveRoutePath` before the resource judgment. Standard/query route branches still use the existing path parser.
- The resource emitter now consumes `planned.runtimePath` and `planned.constantKey` rather than recalculating those projections.

## Validation

- Focused static audits Phase2360 through Phase2367: passed (each historical audit script was run against the evolved source; the Phase2366 and Phase2367 scripts were updated only where their assertions described the superseded resource path wiring).
- Phase2369 contract audit: 10/10 passed.
- Focused TypeScript check was attempted with the installed compiler. It did not pass because the checkout has existing unrelated compile errors and missing Node type declarations; see the phase report for examples. No `npm run build` was run.

## Explicitly incomplete

- `laravelRouteScanner.ts` still imports `semantic/relations` for other scanner operations.
- The active scanner still imports route emission and resource registration operations from `subscanners/route-scanner`; that path has not yet been fully migrated into existing upstream-owned contracts.
- `resourceRegistrationFromDeclaration` still consumes `RouteDeclarationAst` in the scanner layer; registration evidence is not yet a complete upstream-owned contract.
- `RouteEmission` remains declared in `routeEmitter.ts`, and the route emitter still uses relation helpers for target materialization.
- No CLI end-to-end test or runtime route-output regression test was executed.

Phase2369 is a bounded contract evolution, not a claim that the full interface-first mission is complete.
