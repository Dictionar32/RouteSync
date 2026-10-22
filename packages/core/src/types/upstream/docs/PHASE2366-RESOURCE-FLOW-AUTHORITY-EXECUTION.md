# Phase2366 — Resource Flow Authority Execution

## Evidence and root cause

The existing `RouteResourceFlowJudgment` in `routeResourceFlow.ts` contains the resolved resource action/path plan. Before this phase, the active `LaravelRouteScannerInterface.scan` path called `emitResourceRoutes(...)`, which invoked `resolveRouteResourceFlowJudgment(...)` inside the emitter. The semantic operation existed, but it was not a dependency on the existing scanner interface and the emitter combined resolution with execution.

## Contract evolution

The existing `RouteResourceFlowJudgment` is retained. `RouteResourceFlowAuthority` explicitly describes the upstream operation:

`ResolveApiResourceFlowInput + required mode -> RouteResourceFlowJudgment`

The existing `LaravelRouteScannerInterface` now owns `routeResourceFlowAuthority`. Its contract and related scan judgments advance to version 26 so the operation is visible and injected through the same active scanner boundary; no duplicate scanner interface or generic wrapper is introduced.

## Active CLI flow after the change

`CLI scan -> manifest invocation pipeline -> LaravelSourceAstPipeline -> LaravelRouteScannerInterface.scan -> declarationMethodAuthority.judge -> routeResourceFlowAuthority.resolve -> RouteResourceFlowJudgment -> emitResourceRoutesFromJudgment -> RouteEmission -> RouteBoundaryContract -> RouteProducerInput -> RouteProducer.produce -> RouteAst -> manifest projection`

`emitResourceRoutesFromJudgment` consumes `judgment.plan`; it does not call the semantic resolver. The scanner factory captures the injected authority rather than reading it back from the exported singleton.

## Remaining limitations

This is a bounded improvement, not final architectural completion. The canonical scanner still imports the executor from `subscanners/route-scanner`; `routeResourceFlow.ts` still depends on `semantic/relations`; registration is still projected from `RouteDeclarationAst`; and `emitDeclaration` still combines declaration-path resolution, authorization, and route-family dispatch. In addition, `emitResourceRoutesFromJudgment` still calls `resolveRoutePath` on each planned path to derive scanner-specific `ResolvedRoutePath` fields. The judgment is consumed, but its path contract is not yet sufficient for a fully mechanical emitter. The legacy `emitResourceRoutes` compatibility entrypoint still resolves then delegates. Those paths require further contract-owner analysis and regression tests before they can be removed safely.
