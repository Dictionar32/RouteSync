# RouteSync Phase2412 — Route Response ADT Ownership and Projection Gap

## Scope

This phase continues from Phase2411 by tracing the *receiving type owners* after the Integrated Response judgment is dropped: route boundary options, route binding, endpoint response binding, and the canonical route AST. The purpose is to establish which existing ADT must evolve before safe production wiring can occur.

## Source trace

1. `LaravelControllerScannerExecutor` calls the existing `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse(...)`. A controller artifact retains `responseJudgment` and `projectionJudgment`.
2. `LaravelRouteScannerExecutor` receives the complete `controllerScan`, but passes only `controllerScan.controllers[].actionJudgments` and action flow contracts into the route emission path. Response judgments are not forwarded to `emitDeclaration`.
3. `emitDeclaration` creates `VoidResponseDescriptor.create()` and passes it to both resource and standard route target construction.
4. `routeBoundaryContractFromRouteFacts` copies the target `ResponseDescriptor` into `RouteBoundaryOptions`.
5. The boundary's `RouteBindingContract.response` remains typed as the compatibility `ResponseDescriptor`.
6. `routeProducerInputFromRouteBoundary` collapses that descriptor to `EndpointResponseBinding`: for resource/model/inline/void descriptors it emits `declared_response` with a synthesized response reference and cardinality; otherwise it emits `empty_response`.
7. `EndpointResponseBinding` has only `declared_response`, `inline_response`, `redirect_response`, `file_response`, and `empty_response`. It cannot retain the canonical method `ResponseResult`, its exact `ResponseDefinition`, DTO response-contract judgments, or an explicit blocked route-response projection.
8. The canonical route AST stores `RouteBindings.response: EndpointResponseBinding`; once route producer input composition has collapsed the descriptor, the downstream AST/manifest/CLI path has no exact method-response product to recover.

## Root cause

The missing contract is not another response authority. The existing response pipeline already owns canonical response meaning. The gap is that the route-facing response type owners still terminate in the compatibility `ResponseDescriptor` and a lossy `EndpointResponseBinding` ADT.

A direct `ResponseResult` → `ResponseDescriptor` conversion is not justified: the ADTs are not isomorphic. In particular, content/JSON/DTO payloads, redirect results, branch results, no-content, resource results, and unresolved output types have different evidence requirements. A generated name plus a default cardinality is not a semantic projection.

## Existing contract owners to evolve

- `LaravelControllerResponseSemanticPipelineInterface` / `LaravelControllerMethodResponseAstProjectionInterface`: preserve the canonical per-method product and its exact source/action ownership; do not add a second response authority.
- `RouteBoundaryOptions` and `RouteBoundaryContract`: accept a closed route-response projection outcome rather than assuming a legacy descriptor is the semantic result.
- `RouteBindingContract` and `EndpointResponseBinding`: evolve the existing route response ADT so a completed method-response product or an explicit blocked projection can survive to the canonical route AST.
- `RouteProducerInputComposition`: forward the already-judged route response ADT without deriving a response name, shape, or fallback from descriptor kind.
- `LaravelRouteScanOutcome`: retain explicit blocked response projections instead of turning them into an apparently successful route with a `void` response.

This is a migration of existing owners, not permission to create a parallel response model or to leave the new product as an unused sidecar.

## Production implementation gate

The next production phase must evolve the existing response ADT path end-to-end in one coherent change:

1. Correlate each route declaration to exactly one canonical controller/action publication and its method-owned Integrated Response product using identity plus source span.
2. Represent matched, unmatched, ambiguous, complete, and blocked projection outcomes as a closed ADT.
3. Define explicit projection rules for each supported `ResponseResult` variant. Unsupported or insufficiently proven cases must remain blocked.
4. Thread the result through `RouteBoundaryContract` → `RouteProducerInput` → `RouteAst` → source AST/manifest/CLI.
5. Remove `VoidResponseDescriptor.create()` from the active route path only after all consumers use the evolved ADT.
6. Add behavior tests for matched/unmatched/ambiguous methods, DTO/JSON, redirect, no-content, resource, branches, and blocked results.

## Why no production source was changed in Phase2412

A route-only wiring change would still have to coerce the product back into `ResponseDescriptor`, or attach an unused parallel field. Both choices violate the existing semantic ownership and closed-contract requirements. The correct change crosses the existing route response ADT owners above and needs consumer-wide migration, not a local cast or fallback. This phase therefore records the exact type boundary and gates the next coherent production migration; it does not claim closure.

## Validation boundary

- Phase2411 handoff audit: rerun before this phase; see the audit output in the phase validation record.
- Phase2412 structural assertions: verify the actual type owners and lossy projection points listed above.
- No full TypeScript typecheck, Vitest, package build, or live scan/sync CLI is claimed.
