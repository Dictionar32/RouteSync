# Phase 2826 — Interface-First Runtime AST Factories and Manifest Trace

## Applied changes

This phase continues the runtime-operation migration by replacing function-shaped AST constructors with explicitly typed, frozen operation objects in the Laravel route AST boundary.

`packages/core/src/compiler/frontend/php/routeAst/routeDeclarationAst.ts` now exports these interface-first operations:

- `routePathLiteralAstFactory.create`
- `middlewareNameAstFactory.create`
- `routePrefixAstFactory.create`
- `routeNamePrefixAstFactory.create`
- `routeControllerAstFactory.create`
- `routeDomainAstFactory.create`
- `routeConstraintParameterAstFactory.create`
- `routeConstraintValueAstFactory.create`
- `routeConstraintArgumentAstFactory.pattern / values / none`

`packages/core/src/compiler/frontend/php/routeAst/routeResourceDeclarationAst.ts` now exports:

- `routeResourceMiddlewareAstOperation.derive`
- `routeResourceNameAstFactory.create`
- `routeResourceControllerAstFactory.create`
- `routeResourceActionAstFactory.create`
- `routeResourceRouteNameAstFactory.create`
- `routeResourceParameterAstFactory.create`

The former exported function-shaped constructor names were removed and consumers/tests migrated to operation calls. The route AST barrel now explicitly exports the replacement runtime operations. Route constraint ADT variants are built through their domain factory rather than repeatedly constructing anonymous `kind` objects in parser code.

## ADT behavior

`RouteConstraintArgumentAst` remains the closed `pattern | values | none` algebra. Its factory owns variant construction, and the existing `routeConstraintAlgebra.match(...)` remains the domain operation for consuming upstream constraint arguments. `RouteSyntaxSemanticFact` continues to expose `continueForProofRelation`, so the route-syntax facts can be followed into the correct proof relation without introducing a generic reasoning dispatcher.

No new reasoning primitive or parallel route-syntax judgment was introduced. `packages/core/src/types/upstream/collections.ts` remains 0 bytes.

## CLI → manifest → trace review

The existing contracts remain the runtime authority boundary; this phase did not add duplicate manifest contracts:

1. CLI scan uses `RouteSyncCliManifestScanOperationInterface`.
2. CLI composition uses `RouteSyncCliUpstreamCompositionInterface`.
3. Controller invocation manifest composition uses `ControllerInvocationManifestCompositionAuthorityInterface`.
4. Source AST processing uses `LaravelSourceAstPipelineInterface`.
5. Manifest semantic projection uses `SemanticDataflowManifestSurfaceInterface`.
6. Manifest build uses `ManifestBuilderJudgment`, retaining explicit `complete | blocked` outcomes.
7. CLI/upstream barrel exports were checked alongside runtime consumer usage.

A blocked source/manifest derivation must not be converted into an empty successful manifest. Existing typed judgments and their domain continuation/operation boundaries remain in force.

## Audit

Command:

`npm run audit:phase2826-runtime-ast-factory-migration`

Result: **25/25 structural checks passed**, including interface-first frozen exports, migrated parser usage, explicit barrel exports, the existing CLI/upstream manifest trace contracts, domain-operated route-syntax facts, and the empty collections module.

These checks are structural. They do not establish successful TypeScript typechecking, full build, runtime tests, or end-to-end CLI scanning. This workspace snapshot has no installed dependencies/toolchain sufficient to claim those results.

## Follow-up suggestions

1. Continue owner-by-owner through scanner and AST runtime exports; classify constructors, projections, and semantic judgments separately rather than mechanically wrapping every function.
2. For each candidate, inspect `packages/core/src/types/upstream` and the owning barrel before adding any contract. The prior 41-file missing-barrel inventory is a candidate list, not proof that all entries belong in the public barrel.
3. Verify actual runtime consumers alongside barrel exports. A public export alone does not prove that a runtime path uses the contract.
4. Restore the supported TypeScript/dependency toolchain, then run typecheck, focused route AST tests, scanner tests, and CLI manifest E2E with both complete and blocked fixtures.

## TypeScript reference

The migration follows TypeScript's structural interface contracts and discriminated-union guidance: https://www.typescriptlang.org/docs/handbook/interfaces and https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html.
