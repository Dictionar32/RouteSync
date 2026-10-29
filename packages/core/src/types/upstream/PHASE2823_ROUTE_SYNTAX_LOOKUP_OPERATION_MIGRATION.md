# Phase 2823 — Route Syntax Lookup Operation Migration

## Scope

Migrated three exported function-shaped lookup operations in `semanticRouteSyntaxRelations.ts` to explicit, frozen, interface-first runtime operation objects:

- `routeMethod` -> `routeMethodLookupOperation.lookup`
- `routeConstraintMethod` -> `routeConstraintMethodLookupOperation.lookup`
- `resourceMethod` -> `resourceMethodLookupOperation.lookup`

Each operation has its own domain interface. No generic lookup interface was introduced. Repository-wide TypeScript source search found no call sites for the retired names, so no consumer migration was necessary. The similarly named private `resourceMethod` helper in `laravelRouteDeclarationMethodSemanticAuthority.ts` is a separate local implementation and is not changed by this phase.

## Runtime manifest trace retained

`CLI scan/sync -> RouteSyncCliUpstreamCompositionInterface -> RouteSyncCliManifestScanOperationInterface.scan -> ControllerInvocationManifestCompositionAuthorityInterface.compose -> ManifestBuilderOperationPreparationInterface.prepare -> ManifestBuilderInterface.build -> LaravelSourceAstPipelineInterface.execute -> complete|blocked AST judgment -> complete|blocked source-model judgment -> SemanticDataflowManifestSurfaceInterface -> ManifestBuilderJudgment complete|blocked -> routeManifestProjection.continue(handlers) -> validation -> serialization -> persistence`.

Trace evidence and audit recommendations remain separate. This phase does not introduce a reasoning primitive and does not reinterpret AST failures as empty successful manifests.

## ADT rule

Judgment ADTs must own domain continuations/consumption operations; `RoutePathTokenFact.continueForAcceptance` remains the route-path example. The three lookup objects return existing `Presence<T>` vocabulary and are operations, not newly invented judgment ADTs. Existing upstream contracts are preferred; public barrel exports are added only when ownership and consumer intent justify them.

## Verification

`npm run audit:phase2823-route-syntax-lookup-operations` checks the interface-first operation shapes, retired exports, route-path domain continuation, and the zero-byte `collections.ts` invariant. This is a structural audit only. TypeScript build, full test suite, and CLI scan/sync end-to-end have not been run because `node_modules` is absent in the workspace.
