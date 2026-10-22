# Phase 2362 — Route method judgment projection

## Finding

The active route scanner already obtains `LaravelRouteDeclarationMethodJudgment` from `LaravelRouteScannerInterface.declarationMethodAuthority` and passes it to `routeProducerInputFromRouteBoundary`. However, `routeProducerRelations.ts` separately called `routeDeclarationSemanticKind(declaration.method)` to decide whether the resulting AST was a resource, API resource, singleton, API singleton, or standard route. This re-read the source declaration after the upstream method authority had already made the closed judgment.

## Change

The route projection now selects `RouteSpecialKind` from the supplied `LaravelRouteDeclarationMethodJudgment`. Resource family variants are projected from the judgment's `method` field; the remaining closed judgment variants project to `standard`. The declaration AST remains an evidence source for declaration details such as middleware configuration, but it is no longer reclassified to determine the special-route semantic kind.

No new interface or duplicate ADT was introduced. The existing upstream method judgment remains the authority and the existing `RouteProducerInput` remains the producer input contract.

## Trace

`packages/cli/src/commands/scan.ts` → `buildManifestWithInvocationPipeline` → `controllerInvocationManifestCompositionAuthority.compose` → `LaravelSourceAstPipeline` → `LaravelRouteScannerInterface.scan` → `declarationMethodAuthority.judge` → `routeProducerInputFromRouteBoundary(methodJudgment)` → `RouteProducer.produce` → `RouteAst`.

## Scope and limits

This change removes one proven downstream semantic reclassification. It does not remove the remaining `semantic/relations` or subscanner dependencies from `routeProducerRelations.ts`, and it does not establish that the entire scanner is free of semantic decisions. The projection module still performs other contract construction and mapping. Typecheck, Vitest, build, and end-to-end CLI execution must be reported separately from static audit results.
