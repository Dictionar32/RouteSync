# RouteSync Phase 2387 — Manifest Builder Operation Injection

## Audit and trace

The upstream manifest already has a closed `ManifestBuilderInterface`, a typed `ManifestBuilderInput`, a closed `ManifestBuilderJudgment`, and an existing `LaravelSourceAstPipelineInterface`. The manifest builder preserves blocked source-AST projection as `manifest_builder_blocked` rather than converting it to an exception.

The initial gap was hidden source-AST pipeline wiring. Follow-up tracing found two additional manifest-producing operations executed inside the builder without being declared in its dependency contract: dataflow query-policy materialization and resource-group capability composition. Phase2388 closes those dependencies by reusing the existing dataflow manifest surface and resource-group capability algebra contracts.

## Minimal contract evolution

- Evolved the existing `ManifestBuilderInterface` to contract version 6 and made its existing `sourceAstPipeline` dependency explicit.
- Changed `constructRouteSyncManifest` to receive the existing `LaravelSourceAstPipelineInterface` and invoke that injected operation.
- Added `createManifestBuilder(sourceAstPipeline)` as the composition function for the existing builder contract; the canonical exported builder injects the existing `laravelSourceAstPipeline` at the composition root.
- Kept the current `ManifestBuilderInput`, `ManifestBuilderJudgment`, and blocked outcome intact. No duplicate manifest interface, generic wrapper, or new semantic authority was introduced.
- The CLI still calls `manifestBuilder.build(...)`; the behavioral path remains `CLI composition → ManifestBuilderInterface.build → injected source-AST pipeline → typed projection judgment → existing dataflow surface (seed + judgment + query-policy materialization) and resource capability algebra → manifest completion/blocker`.

## Verification

Run:

```sh
node scripts/audits/audit-phase2387-manifest-builder-operation-injection.cjs
node scripts/audits/audit-phase2388-manifest-semantic-operations.cjs
node scripts/audits/audit-phase2386-direct-route-boundary-operation.cjs
```

This is a structural operation-wiring closure only. A package build, TypeScript typecheck, Vitest run, and real CLI scan were not run in this environment. Phase2386's known route-path gaps remain: active imports from `subscanners/route-scanner` and `subscanners/routeProducerRelations`, scanner-owned method-judgment dispatch, and lack of end-to-end CLI verification. Phase2387 does not claim to close those route-specific gaps.


## Phase2388 follow-up

The manifest operation contract is now explicit for source-AST projection, dataflow policy materialization, and resource-group capability composition. Structural checks are not a substitute for TypeScript compilation, Vitest, package build, or real CLI execution; those remain unverified in this environment. The source-model builder function is still a direct function call rather than an injected operation contract and remains a candidate for the next upstream ownership audit.
