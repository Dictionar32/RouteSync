# Phase 2363 — Resource registration preservation and runtime boundary audit

## Proven defect

In `packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts`, the `RouteSpecialKind` registration previously hard-coded `only` and `except` to empty sequences, `shallow` and `scoped` to false, and `creatable` and `destroyable` to true. The source AST already carries `resourceActionFilter`, `resourceShallow`, `resourceScoped`, `resourceCreatable`, and `resourceDestroyable` in `packages/core/src/compiler/frontend/php/routeAst/routeDeclarationAst.ts`. This meant the canonical `RouteAst` could lose source-declared resource semantics even when the parser had retained them.

## Change

The existing projection now carries those declaration facts into `RouteSpecialKind.resource` instead of replacing them with constants. No new interface or duplicate ADT was introduced.

## Why runtime code still exists

This phase does not establish the desired interface-first architecture. `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` still contains `emitDeclaration`, which dispatches on `LaravelRouteDeclarationMethodJudgment` and calls route-emission helpers. It also imports `semantic/relations` and multiple subscanner modules. `routeProducerRelations.ts` still performs contract projections and imports `semantic/relations`/relation-membership. The existing `LaravelRouteDeclarationMethodJudgment` decides method family and HTTP methods, but it does not carry a complete route-emission judgment including resolved path, resource registration, target, authorization, and source provenance. Consequently, the executor boundary remains incomplete.

## Correct next architectural step

Trace and evolve the existing `LaravelRouteScannerInterface` and route emission/route boundary contracts so an upstream-owned authority receives typed source evidence and emits a closed route-emission judgment containing all resolved route artifacts. Only after that judgment is complete should the scanner executor consume the judgment and materialize `RouteAst`. Do not move `emitDeclaration` to another file and call that an architectural fix. The upstream input evidence also needs to be strengthened before introducing such an authority; in particular, `RouteDeclarationEvidence` currently has weak fields (`unknown` and primitive strings) and omits resource modifiers, so it is not yet a sufficient closed contract for this operation.

## Verification limits

The audit script checks preservation of resource semantics and confirms the current method-judgment wiring. It is a static source audit, not a TypeScript typecheck, unit test, build, or CLI end-to-end run.
