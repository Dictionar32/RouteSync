# Phase2373 — Active Laravel Route Declaration Audit, Trace, and Contract Sufficiency

## Scope and honesty boundary

This phase is based on the actual extracted Phase2372 source tree. It records the audited active path and the contract decision required before changing executor code. It does not claim end-to-end integration, type-check success, or CLI runtime verification.

## 1. Audit and active CLI trace

The active route scanner is wired by `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` and supplied to the source AST pipeline as `laravelRouteScanner`. The CLI scan command reaches that pipeline through `buildManifestWithInvocationPipeline(...)`.

Active route path:

`packages/cli/src/commands/scan.ts` → `buildManifestWithInvocationPipeline(...)` → `LaravelSourceAstPipeline` → `LaravelRouteScannerInterface.scan(...)` → `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` → `RouteEmission` → `routeBoundaryContractFromRouteEmission(...)` → `routeProducerInputFromRouteBoundary(...)` → `RouteProducer.produce(...)` → `RouteAst` / manifest projection.

## 2. Existing contract owners

- `RouteDeclarationEvidence` in `packages/core/src/types/upstream/routeDeclarationEvidence.ts` is the canonical source evidence contract. It already carries method, target methods, path, target ADT, prefix, middleware, resource modifiers, bindings, constraints, group controller/domain, and provenance.
- `LaravelRouteDeclarationMethodJudgmentAuthority` in `packages/core/src/types/upstream/laravelRouteScannerInterface.ts` owns declaration method-family judgment only.
- `RouteResourceFlowAuthority` in `packages/core/src/types/upstream/routeResourceFlow.ts` owns resource action/path planning from declaration evidence only.
- `RouteProducer` in `packages/core/src/types/upstream/route.ts` owns AST materialization from a complete `RouteProducerInput`.
- `RouteBoundaryContract` is an existing downstream contract, but the active flow currently constructs it from `RouteEmission`; it is not currently the upstream declaration judgment.

## 3. Actual authority gaps

`packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` still:

- calls `routeDeclarationFlow(declaration)` in `emitDeclaration`;
- calls it again from `controllerNameOf` and `actionNameOf`;
- resolves standard/query paths with `resolveRoutePath(...)` before emission;
- imports `emitResourceRoutesFromJudgment`, `emitStandardRoutes`, and `RouteEmission` from `subscanners/route-scanner`;
- imports `semantic/relations` directly;
- projects `RouteEmission` to `RouteBoundaryContract` only after the emitter has already made a route emission.

The resource branch is further along: it converts the declaration to existing `RouteDeclarationEvidence` and calls `RouteResourceFlowAuthority.resolveDeclaration(...)`. That does not give the same authority over standard routes or make the full declaration path interface-first.

## 4. Root cause

The missing concept is not another resource authority or another scanner wrapper. The existing method authority and resource authority have deliberately narrower responsibilities. The active path has no existing injected contract that owns a complete route-declaration judgment spanning method family, target, group/path context, route family, middleware and source provenance before emission.

`LaravelRouteScannerInterface` is the orchestration/executor contract. Adding more unrelated fields to it without a complete semantic judgment would only make wiring look more explicit while leaving semantic decisions in the executor.

## 5. Contract sufficiency decision

Use `RouteDeclarationEvidence` as the canonical input; do not add a parallel evidence shape. Preserve the existing method and resource authorities for their bounded responsibilities. Before moving runtime code, the next contract design must determine how the existing declaration flow/evidence contracts can express a complete closed declaration judgment and how that judgment feeds the existing emission/producer contracts.

The judgment must provide all data needed by emission so the scanner/emitter does not reconstruct controller/action, path identity, route family, or resource semantics. It must not infer data unsupported by source evidence. The design must account for standard/query/resource route families without collapsing them into a generic open object.

## 6. Forbidden dependencies and known remaining work

The active scanner still imports `semantic/relations` and `subscanners/route-scanner`. `routeResourceFlow.ts` itself avoids `semantic/foundation` and `semantic/relations`, but that is not proof the active scanner path is clean. `routeProducerRelations.ts` and `routeEmitter.ts` also retain relation imports.

No files were deleted to hide dependencies. No `npm run build` was run. No CLI end-to-end test was run in this phase.

## 7. Audit commands actually run

- `node scripts/audits/audit-phase2372-active-route-declaration-authority.cjs` — PASS, 16/16 checks.
- `node scripts/audits/audit-phase2371-existing-declaration-evidence-authority.cjs` — PASS, 10/10 checks.
- `node scripts/audits/audit-phase2370-scanner-contract-first-resource-authority.cjs` — FAIL, 10/11 checks. Its stale expectation that the scanner interface had evolved before wiring does not match the later Phase2372 contract version. This is recorded as a stale audit failure, not hidden or counted as a pass.

## 8. Completion status

Audit, trace, authority evaluation, root-cause identification, and contract-sufficiency analysis are documented. Interface/ADT evolution for the full declaration judgment, executor integration, CLI end-to-end verification, and full regression remain unfinished. This phase is not a completion claim.
