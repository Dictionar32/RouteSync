# Phase2372 — Active Route Declaration Authority Audit and Evidence Contract Evolution

## Scope and source

This phase starts from the uploaded Phase2371 ZIP extracted to `/tmp/rs2371/RouteSync`. It does not claim to modify the user's local `/home/annas-zen/Documents/RouteSync` directory.

## Audit and trace

The active route scanner is `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` imports `laravelRouteScanner` and supplies it as `routeScanner` to the source AST pipeline. The active scanner's `scan` operation is injected with the method authority, authorization authority, effective controller-action policy executor, resource flow authority, and route producer.

The method authority owns method-family judgment only. `RouteResourceFlowAuthority` owns resource-flow judgment only. Neither contract resolves a complete declaration spanning target, effective path/group context, bindings/constraints, middleware, route family, and emission inputs.

The active scanner still calls `routeDeclarationFlow(declaration)`, while `controllerNameOf` and `actionNameOf` each call it again. Standard/query branches still call `resolveRoutePath`. The active scanner imports `emitResourceRoutesFromJudgment`, `emitStandardRoutes`, and `resolveRoutePath` from `subscanners/route-scanner`; it also imports `semantic/relations`. `RouteEmission` is still declared in `routeEmitter.ts`, then projected by `routeBoundaryContractFromRouteEmission` and `routeProducerInputFromRouteBoundary` before `RouteProducer.produce` materializes `RouteAst`.

The old Phase880 audit targets `packages/core/src/compiler/scanner/subscanners/RouteScanner.ts`, a legacy scanner, not the active wiring scanner. Its PASS therefore does not establish that the active scanner's operations are controlled by a complete contract.

## Root cause

The current upstream contracts have narrow ownership: method family, resource action/path plan, authorization, controller-action policy, and final AST production are separated. No injected contract owns a complete route-declaration judgment. Adding an arbitrary operation directly to `LaravelRouteScannerInterface` would conflate orchestration with semantic authority; widening the method or resource authority to cover unrelated semantics would also violate their current ownership.

## Existing evidence contract evolved

`packages/core/src/types/upstream/routeDeclarationEvidence.ts` is strengthened rather than introducing a parallel evidence type:

- The canonical Laravel method vocabulary now belongs to the declaration evidence contract and is re-exported by the scanner interface for compatibility.
- `RouteDeclarationTargetEvidence` is a closed discriminated union; each variant carries only fields valid for that target kind.
- `bindings` and route constraints have named typed contracts instead of `unknown` arrays/arguments.
- Resource middleware evidence has a named contract.
- Optional group controller/domain, custom binding key, and span are represented with explicit `absent` variants instead of optional properties.
- Closure return AST nodes were removed from neutral evidence because no current consumer uses them; semantic return evidence remains carried separately by the route production path.

This is a contract-strengthening step, not a completed declaration authority. The AST-to-evidence projection in `routeProducerRelations.ts` was updated to produce the closed evidence variants.

## Validation

- `audit-phase2372-active-route-declaration-authority.cjs`: 16/16 checks pass. It verifies both the contract tightening and the still-open active scanner boundaries.
- `audit-phase2371-existing-declaration-evidence-authority.cjs`: 10/10 pass.
- `audit-phase2367-resource-plan-path-consumption.cjs`: 8/8 pass.
- Updated `audit-phase2366-resource-flow-authority-execution.cjs`: 12/12 pass after aligning its expectations with the current authority contract.
- Global TypeScript 5.8.3 `tsc --noEmit` was attempted and failed before a usable type-check: the repository's `target`/`lib` options are unsupported by this compiler version, and `effectiveControllerActionPolicyResolver.phase921.test.ts` has syntax diagnostics at lines 47 and 221. No conclusion about the changed contract's type correctness can be drawn from this failed run. `npm run build` was not run. CLI end-to-end was not run.

## Not complete

The complete declaration judgment owner has not yet been introduced/evolved; scanner still performs declaration-flow projection, controller/action projection, standard path resolution, and route-family dispatch. `semantic/relations` and `subscanners/route-scanner` remain on the active path. The `RouteEmission` → boundary → producer relation still needs contract-owner work. CLI execution and runtime regressions remain unverified.

Next step must use the existing evidence and declaration-flow concepts to define the correct semantic owner before executor changes. Do not move `emitDeclaration` to another file or add a generic wrapper as a substitute.
