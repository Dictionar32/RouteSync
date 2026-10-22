# Phase2379 — Route Declaration Evidence Closure Trace (Superseded by Phase2380)

## Purpose

Continue Phase2378 by tracing a concrete semantic field needed to make the route declaration judgment closed. This phase deliberately avoids adding a new authority before its input evidence can represent all semantics the existing emitter consumes.

## Trace evidence

1. `RouteDeclarationAst.target` has a closure variant with `returns: readonly PhpAstValue[]`.
2. `RouteDeclarationEvidence.target` preserves the closure action but has no closure-return field.
3. `routeDeclarationEvidenceFromAst` converts the closure target into `{ kind: 'closure', action }` and drops `returns`.
4. The active scanner separately obtains `RouteDeclarationFlow` from the compiler lexer and computes `controllerReturnSemanticFromValues(flow.target.value.returns, file)` inside `emitDeclaration`.
5. `StandardRouteTarget` requires `semanticReturn: ControllerReturnSemantic` for its closure variant; `RouteEmission` then carries that result downstream into `RouteBoundaryContract`.
6. Therefore `RouteDeclarationEvidence` alone cannot currently support a complete declaration judgment for closure routes without either dropping semantics or making the upstream contract depend on compiler AST types.

## Root cause

The upstream evidence boundary is not semantically lossless for closure targets. The scanner compensates by retaining a second compiler-owned dataflow path. This is an actual contract gap, not merely a missing call or dependency-injection field.

The method, resource, path, and authorization authorities are narrower authorities and should remain narrow. `LaravelRouteScannerInterface` is orchestration, not the owner of the complete route judgment. The correct next design step is to define a layer-neutral, typed closure-return evidence ADT at the source-evidence boundary (or an existing proper upstream owner if one already exists), then make the return semantic authority consume that evidence and include its judgment in the closed route declaration result. Do not copy `PhpAstValue` into `types/upstream`, and do not substitute an `absent` return judgment merely to make the contract appear complete.

## Checks

`node scripts/audits/audit-phase2379-route-declaration-evidence-closure.cjs` — **PASS 8/8**. These checks verify the current gap and field flow; they do not claim implementation closure.

The prior Phase2378 structural sufficiency audit should also be run from the same repository root. No TypeScript typecheck, build, or end-to-end CLI regression is claimed in this phase. `npm run build` was not run.

## Next implementation gate

Trace the existing typed expression/return evidence contracts and their producer before introducing anything new. Reuse or evolve the correct source-evidence contract, then integrate this order:

`typed closure-return evidence → return semantic judgment → complete route declaration judgment ADT → operation contract → integrated response/boundary → runtime executor → CLI path`

Only after that chain is represented in types should scanner dispatch be replaced. A report-only authority wrapper or moving `emitDeclaration` to another file is not an acceptable closure.


## Follow-up status

Phase2380 closes the specific closure-return field-loss gap by attaching the existing `ControllerReturnSemantic` ADT to the closure target of `RouteDeclarationEvidence` and making active route emission consume that evidence. The return semantic is produced through the existing `ControllerReturnSemanticProductionInterface` shape. This does **not** close the full route declaration judgment authority or retire scanner-owned method-family dispatch; those remain open.
