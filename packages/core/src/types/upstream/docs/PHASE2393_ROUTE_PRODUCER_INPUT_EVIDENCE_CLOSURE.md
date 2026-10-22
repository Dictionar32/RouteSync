# Phase2393 — Route Producer Input Evidence Closure

## Objective

Close the unnecessary dependency from route producer-input composition back to the concrete route declaration AST. The canonical `RouteDeclarationEvidence` is produced once by the scanner and is the data contract used by the downstream producer-input projection.

## Audit and root cause

`routeProducerInputFromRouteBoundary` previously accepted both `RouteDeclarationEvidence` and `RouteDeclarationAst`. The evidence already carried the route-group facts needed for `RouteGroupContext`, but the producer-input composer re-entered `routeDeclarationFlow(declaration)` to recover the group fact from the AST. This created a second read of source syntax after canonical evidence had been established.

## Changes

- Removed the concrete `RouteDeclarationAst` parameter from `routeProducerInputFromRouteBoundary`.
- Added `routeGroupFactFromEvidence`, a projection from the existing `RouteDeclarationEvidence` contract to the existing `RouteGroupFact` ADT.
- Preserved group prefix, middleware, name prefix, controller, domain, binding scope, constraint method/parameter/argument, and group provenance.
- Resolved `RouteGroupContext` using the existing `resolveRouteGroupContextFromFact` operation.
- Updated the scanner to pass the existing evidence and source span to producer-input composition.
- Kept the canonical `RouteProducer.produce(...)` as the only `RouteAst` materializer.
- Did not introduce a new interface or ADT, and did not add a `semantic/foundation` dependency.
- Updated historical structural audits whose old assertions expected the removed AST parameter.

## Verified results

- Phase2380 through Phase2393 audit scripts: **15/15 passed**.
- Aggregate structural assertions across those scripts: **139/139 passed**.
- TypeScript parser syntax checks for both changed TypeScript files: **2/2 passed**.

The parser checks establish syntax validity only. Full typecheck, Vitest, package build, and CLI scan/sync end-to-end were not run; no claim of full compilation or runtime success is made.

## Remaining architectural gaps

- `laravelRouteScanner.ts` still imports active operations from `subscanners/route-scanner` and `subscanners/routeProducerRelations`.
- Method-judgment dispatch still occurs in the scanner / producer-input projection path.
- The current change removes a redundant AST reread but does not retire the subscanner modules.
- Invocation judgment → integrated response → runtime executor → manifest → CLI still needs real end-to-end verification.

## Next investigation

Trace ownership of route-boundary projection and producer-input composition against the existing `LaravelRouteScannerInterface`, `RouteBoundaryContract`, and `RouteProducer` contracts. Evolve an existing owner only if its semantics fit; do not move code solely to make the subscanner directory appear empty.
