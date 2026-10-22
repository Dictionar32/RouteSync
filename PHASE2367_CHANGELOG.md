# Phase 2367 — Resource Plan Path Consumption

## Root-cause adjustment

The active resource judgment executor previously called `resolveRoutePath(planned.path.value.value, [])`, which reparsed an upstream-planned URI and re-derived resource identity and parameters from the path. The executor now consumes `planned.path`, the resource identity from `judgment.plan.resource`, and the already-closed `planned.parameters` list. The existing target projection fields (`runtimePath` and `constantKey`) are still materialized for the established `RouteEmission`/`RouteProducer` contract.

The upstream resource plan now aligns the planned parameter names with shallow-resource path shape: shallow item routes carry only the leaf parameter, while nested item routes carry the full parameter sequence.

## Actual path

`CLI -> LaravelRouteScannerInterface.scan -> injected routeResourceFlowAuthority.resolve -> RouteResourceFlowJudgment.plan -> emitResourceRoutesFromJudgment -> RouteEmission -> RouteProducer.produce -> RouteAst`.

## Verification

- Phase 2367 static audit: 8 checks.
- Focused audit sweep: Phase 2350–2367 scripts.
- ZIP integrity checked after packaging.
- No `npm run build` was run. TypeScript type-check and CLI end-to-end execution were not run because this extracted archive has no `node_modules`.

## Explicitly not complete

This phase does **not** complete the requested architecture-wide interface-first cutover. The active scanner still imports the emitter from `subscanners/route-scanner`; `routeResourceFlow.ts` still imports `semantic/relations`; `resourceRegistrationFromDeclaration` still projects the Laravel declaration AST; and `emitDeclaration` still combines path preparation, authorization, and route-family dispatch. The runtime still computes target projection fields. Those remaining boundaries need separate owner/contract work and runtime tests. Do not treat this phase as proof that all runtime semantic reasoning has been eliminated.
