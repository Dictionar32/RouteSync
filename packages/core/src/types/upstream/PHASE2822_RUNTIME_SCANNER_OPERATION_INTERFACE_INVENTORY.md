# Phase 2822 — Fully Typed Runtime Scanner Operation Inventory

## Purpose

Continue the Phase 2819–2821 work from the actual runtime boundary rather than treating barrel additions as proof that consumers use canonical contracts. The audit inspects the CLI manifest composition/scan boundary, manifest projection ADT, and the route-syntax/dataflow owners that feed route declarations into manifest production.

## Runtime trace

```text
CLI scan/sync
  -> RouteSyncCliUpstreamCompositionInterface
  -> RouteSyncCliManifestScanOperationInterface.scan(input)
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> complete | blocked source-AST judgment
  -> complete | blocked source-model judgment
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment complete | blocked
  -> routeManifestProjection.continue(handlers)
  -> validation -> serialization -> persistence
```

Trace statements above describe the audited composition path; audit suggestions are not runtime trace facts.

## Interface-first migration policy

Runtime operation objects should be declared as `export const operation: ExistingOrApprovedInterface = Object.freeze({...})`. Remove exported function declarations and inferred arrow exports only after identifying their domain owner contract and updating every consumer to call the operation's named domain member. Do not preserve old function-shaped APIs as untyped aliases merely to make the migration appear complete.

## Priority order

1. **Manifest boundary:** retain the existing CLI scan, upstream composition, composition authority, builder judgment, and projection ADT contracts. Confirm the runtime consumer calls those interfaces rather than rebuilding judgments locally.
2. **Route syntax owner:** migrate exported operation candidates in `semanticRouteSyntaxRelations.ts` by domain: method recognition, route-path acceptance, constraint extraction, target resolution, group transitions, and invocation evidence. Do not group them into one generic operation interface.
3. **Route syntax consumers:** update `routeDeclarationParser.ts`, `routeResourceDeclarationAst.ts`, and `routeSyntaxSemanticInterface.ts` to consume the owner operations explicitly.
4. **Route dataflow:** migrate route dataflow operations only after checking existing upstream flow/authority contracts and the concrete call graph.
5. **Token vocabulary:** distinguish immutable AST constructors from runtime judgments; only judgment-producing operations require domain ADTs with continuation/consumption operations.
6. **Public barrel:** export only upstream-owned contracts intended as public API. A missing direct barrel entry is not by itself permission to export implementation helpers.

## ADT requirement

A domain ADT must carry its discriminant/evidence and own a domain operation that consumes the result (for example `RoutePathTokenFact.continueForAcceptance`). Complete and blocked remain distinct; AST failure cannot become a successful empty manifest. No generic reasoning primitive or generic relation dispatcher is introduced as a fallback.

## Verification boundary

Run `npm run audit:phase2822-runtime-scanner-operation-interface-inventory` for the structural inventory. This audit intentionally does not mutate source files or claim that all listed candidates should be converted mechanically. Typecheck, build, full tests, and CLI end-to-end require installed dependencies and must be run separately.
