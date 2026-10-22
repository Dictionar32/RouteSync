# RouteSync Phase2411 — Integrated Response Judgment Route Handoff Trace

## Scope
Trace the actual handoff from `LaravelControllerScannerExecutor` through `LaravelRouteScannerExecutor`, route-boundary composition, `RouteProducer`, the source-AST bundle, manifest construction, and CLI projection. This phase does not claim a production fix.

## Findings

1. `LaravelControllerScannerExecutor` builds canonical action judgments and `artifactBase`, then calls `responseSemanticPipeline.judgeIntegratedResponse(...)`. The resulting `responseJudgment` is retained on each `LaravelControllerScanArtifact` alongside `invocationJudgment` and `projectionJudgment`.
2. `LaravelRouteScannerInterface.scan` receives the complete `controllerScan`, so the source-correlated response judgments are present at the route-scanner boundary.
3. The active route scanner does not pass `controllerScan` or its response judgments into `emitDeclaration`. `emitDeclaration` receives only action publications and the action-correlation authority.
4. `emitDeclaration` constructs `VoidResponseDescriptor.create()` and supplies that compatibility descriptor to both resource and standard route emission.
5. `routeBoundaryContractFromRouteFacts` forwards `value.response`; `routeProducerInputFromRouteBoundary` derives `EndpointResponseBinding` from the legacy descriptor kind/shape and its `responseTypeName()` method.
6. The route AST/flow is then retained in the route scan judgment and `SourceAsts`, and subsequently participates in manifest/CLI processing. Since the response judgment was not consumed before route producer input construction, downstream manifest/CLI projection cannot recover the lost method response product without a new semantic join.
7. The canonical `ResponseResult` ADT and compatibility `ResponseDescriptor` ADT are not isomorphic. A blind conversion would misrepresent redirects, content, JSON/DTO results, branches, and resource responses whose canonical identity or cardinality is not proven by the legacy descriptor alone.

## Root cause

The active route-scanner operation contract does not include an operation that correlates a route declaration to the exact per-method Integrated Response outcome and projects that outcome into a closed route-facing response contract. The response judgment exists upstream, but the route-emission operation boundary drops it before `RouteBoundaryContract` and `RouteProducerInput` are composed.

This is an integration/wiring gap plus a missing projection contract, not a missing call to `judgeIntegratedResponse` and not merely a DTO-resolution gap.

## Required production evolution

1. Evolve the existing upstream route-scanner/response-pipeline contracts; do not add a parallel semantic authority.
2. Add a closed operation for route declaration + canonical controller/action identity + existing response judgment to produce either a complete route response projection or an explicit blocked outcome. Correlation must preserve method source identity and provenance.
3. Define explicit supported projection rules between `ResponseResult` and the route-facing response contract. Non-isomorphic or under-evidenced variants must be blocked, not coerced to `void` or guessed from DTO names.
4. Wire that result into route boundary and producer composition; remove `VoidResponseDescriptor.create()` only after every active consumer has migrated.
5. Add behavior tests for matched, unmatched, ambiguous, blocked, resource, no-content, JSON/DTO, redirect, and branch outcomes; then trace retained results through `SourceAsts`, manifest, and CLI.

## Validation

- Phase2410 structural audit rerun: 10/10 assertions passed.
- This phase's structural audit verifies the observed handoff gap and CLI retention path; it does not prove functional integration.
- No production source was changed in this phase.
- Full typecheck, Vitest, package build, and live scan/sync CLI were not run.
