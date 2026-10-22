# Phase2378 — Route Declaration Contract Sufficiency and Authority Ownership

## Scope

This phase continues the active route-flow audit from Phase2377. It evaluates existing contracts and their actual active-path consumers before changing runtime wiring. It deliberately does not invent a generic wrapper or mislabel a syntax flow as a complete semantic judgment.

## Active path trace

1. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` injects `laravelRouteScanner` into the source AST pipeline.
2. `LaravelRouteScannerInterface` (contractVersion 28) injects method, authorization, effective-controller-policy, resource-flow, path-resolution and route-producer operations. It is an orchestration contract.
3. `laravelRouteScanner.ts` parses declarations, calls `declarationMethodAuthority.judge`, derives `RouteDeclarationFlow`, projects target/action, and dispatches resource/query/standard cases through `emitDeclaration`.
4. Resource declarations call `RouteResourceFlowAuthority.resolveDeclaration`; query/standard declarations call `LaravelRoutePathResolutionAuthority.resolve`.
5. Both branches produce `RouteEmission` via `subscanners/route-scanner`.
6. `routeProducerRelations.ts` converts that emission to `RouteBoundaryContract`, then to `RouteProducerInput`; only then does `RouteProducer.produce` materialize `RouteAst`.
7. The resulting AST enters binding judgment, effective controller-action policy execution, `RouteSemanticFlow`, and `LaravelRouteScanJudgment`.

## Existing contract coverage

| Existing contract | Owns | Does not own |
|---|---|---|
| `RouteDeclarationEvidence` | Canonical source evidence: method, target, path, bindings, group context, middleware, resource modifiers, constraints and span | Resolved route operation/target, final route emission or integrated route judgment |
| `RouteDeclarationFlow` in compiler lexer | Typed syntax/data-flow facts for target, bindings, group, constraints and middleware | Upstream semantic authority; it is compiler-owned and does not contain method/path/resource judgments |
| `LaravelRouteDeclarationMethodJudgmentAuthority` | Closed method-family and HTTP-method judgment | Target/action, group/path, middleware, bindings/constraints, full route plan |
| `RouteResourceFlowAuthority` | Closed resource action/path plan from canonical declaration evidence | Standard/query declaration plan or the full declaration judgment |
| `LaravelRoutePathResolutionAuthority` | Resolved path, resource name, parameters, runtime path and constant key | Method family, target/action, authorization, complete route execution plan |
| `RouteBoundaryContract` | Route identity, binding, capability, provenance, endpoint contract and authorization | Source-declaration authority; it is constructed after emission |
| `RouteProducerInput` / `RouteProducer` | Closed AST materialization input and canonical AST construction | Semantic inference needed to produce that input |

## Root cause

The active path has several individually meaningful authorities but no single upstream operation whose output is a complete, closed judgment for a route declaration. The scanner is therefore still the place where those partial judgments are coordinated and interpreted: target/action projection, route-family dispatch, and the choice between resource and standard/query emission. `RouteEmission` is downstream of this dispatch, and the boundary/producer contracts are assembled only after it.

The existing `LaravelRouteScannerInterface` must not be mistaken for the missing semantic authority: it is an orchestration boundary. Widening the method authority or resource authority to own unrelated semantics would violate their semantic ownership. Moving `emitDeclaration` to another file would not fix the authority gap.

## Invocation / operation / integrated response / runtime executor / CLI status

The Phase2375 audit still reports 15/15 checks for the invocation-operation-integrated-response wiring and CLI source AST path. That evidence is scoped to the invocation pipeline and does not close the separate route-declaration judgment gap. The active route scanner is on the CLI path, so route-declaration incompleteness remains an end-to-end limitation even while the invocation sub-pipeline passes its static audit.

## Phase2377 delta retained

Phase2377 changed target/action projection to reuse one `RouteDeclarationFlow` value within `emitDeclaration`. Its 4/4 audit passes. This removes duplicate flow derivation in that function, but does not remove scanner-owned semantic dispatch, `semantic/relations`, or the post-emission boundary conversion.

## Decision / next implementation gate

Do not claim full interface-first route integration yet. Before changing the executor, define and type-check the complete route-declaration judgment at the correct upstream semantic owner, using `RouteDeclarationEvidence` as source evidence and preserving the existing narrower method/resource/path authorities. Its closed output must contain all semantics the route emitter currently consumes, including route-family/action plan, target, effective path and parameters, middleware/authorization inputs, source provenance, and response/target information. Only after that contract is semantically complete should the active scanner be reduced to delegation and the emitter/producer/CLI path be rewired.

This phase makes no claim of full implementation, TypeScript typecheck, build, or end-to-end CLI regression. `npm run build` was not run.
