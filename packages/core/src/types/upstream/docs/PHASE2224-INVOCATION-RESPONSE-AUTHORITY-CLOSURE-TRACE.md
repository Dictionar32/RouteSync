# Phase 2224 — Invocation Semantic Judgment / Integrated Response Authority Closure Trace

## Decision

`LaravelControllerResponseSemanticPipelineInterface` remains the sole authority for integrated HTTP response semantics. Do not introduce a new response authority, `semantic/foundation`, relation replacement, or another subscanner. Interface changes must evolve the existing pipeline and its existing dependency contract.

## Trace from current production code

1. `LaravelControllerScannerExecutor.scanControllers` starts from the canonical invocation inventory and keeps the exact `invocationJudgment` alongside parsed declaration evidence.
2. The scanner calls `responseSemanticPipeline.judgeIntegratedResponse({ invocationJudgment, declarationEvidence, sourceProject, dtoDeclarationInventory })` for each selected controller/action correlation path.
3. The integrated pipeline owns source correlation, response evidence production, per-item source binding, DTO declaration/type-reference resolution, response-contract projection, runtime response execution, method-response AST projection, and the existing AST projection authority.
4. `responseScanner.ts` consumes controller-level closed response products, passes canonical action publications into the existing method projection authority, and publishes AST/definition values only for complete projection judgments.
5. A separate legacy action derivation still runs through `scanControllerAction` → `resolveControllerActionContract` → `resolveResponse` → `resolveResponseAttributeAst`. That path resolves DTO files and merges return observations to produce a compatibility `ResponseDescriptor`.

## Root cause / actual remaining ownership defect

The issue is not a missing response interface. The interface already exists and has a closed integrated judgment. The defect is that the production action contract still demands a response descriptor before the source-correlated integrated response product has been projected back to that compatibility surface. Consequently, two response representations coexist:

- canonical integrated response judgment, correlated to invocation/declaration evidence and the project DTO inventory;
- legacy per-action `ResponseDescriptor`, derived independently from a declared attribute and observed returns.

Adding another authority would deepen the split. Moving the resolver to another file would only relocate the same ownership defect.

## Required interface-first migration

1. Evolve the existing `LaravelControllerResponseSemanticPipelineInterface` contract with a source-correlated compatibility projection from a *closed method response product* to the existing `ResponseDescriptor` domain type, if downstream consumers still require that shape.
2. The projection input must retain the exact canonical invocation/action publication and method source identity, and the exact closed DTO/return response product. A controller-wide DTO inventory alone is insufficient evidence for action-level ownership.
3. Define closed outcomes for complete projection and source-correlation/semantic blockers. No fallback to filename guessing, empty response, or merged fields when correlation is unresolved.
4. Wire the existing action publication/executor to consume that already-produced projection. Runtime wiring must forward the judgment, not derive response meaning.
5. Add parity tests over declared DTO responses, inferred return responses, void/no-attribute responses, ambiguous DTO names, unresolved class references, and mismatched method source spans.
6. Retire `resolveResponse` / `resolveResponseAttributeAst` only after consumers have migrated and parity tests prove equivalent or intentionally stricter results.

## Guardrails

- Do not implement semantic decisions in the scanner.
- Do not replace `if`/`switch` with a relation abstraction and call that semantic ownership.
- Do not add `semantic/foundation`, a parallel response descriptor authority, or a new subscanner.
- Do not call the legacy resolver “retired” until the production dependency graph no longer reaches it.
- Preserve invocation judgment identity through integrated response and AST projection.

## Validation status

This is a source trace and migration contract, not a claim that the legacy response resolver has been removed. Full TypeScript typecheck, Vitest, and package build are not run in this environment. The project owner should run the repository's supported verification workflow on the target Arch Linux environment.

## External design references

- MLIR Interfaces: interfaces let analyses/transformations work against declared contracts rather than hard-coded knowledge of every concrete operation: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Handbook — Interfaces: interfaces name structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript Handbook — Narrowing: discriminated unions model distinct semantic outcomes and enable exhaustive handling: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
