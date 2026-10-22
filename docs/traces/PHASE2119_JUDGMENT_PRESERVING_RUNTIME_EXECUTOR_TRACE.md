# Phase 2119 — Judgment-Preserving Runtime Executor Trace

## Scope

This phase tightens one interface/runtime boundary after Phase 2118. It does not claim to retire the controller subscanner or finish response ownership migration.

## Before

`LaravelControllerActionExecutionResult<TProjection, TInvocationJudgment>` flattened the completed judgment into four fields:

- `invocationJudgment`
- `actionName`
- `contract`
- `dependencies`

The executor adapter copied each field from `input.semanticJudgment`. Although the generic invocation subtype was retained, the result no longer carried the canonical action-judgment object as one indivisible value. This shape allowed downstream code to consume a reconstructed field bundle rather than the exact upstream judgment.

## After

The result is a runtime receipt with one payload:

`semanticJudgment: LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>`

The production executor forwards `input.semanticJudgment` directly. The scanner reads contract and dependency projection from that retained judgment. No action judgment or invocation judgment is rebuilt by the executor.

## Trace

```text
Invocation semantic judgment (closed ADT)
  -> LaravelControllerActionSemanticJudgmentInterface.judge
  -> completed LaravelControllerActionSemanticJudgment
  -> LaravelControllerActionExecutionInterface.execute
  -> controller_action_execution_completed { semanticJudgment: exact input object }
  -> scanner projection reads result.semanticJudgment
```

## Findings that remain open

1. `laravelControllerExecutionDependencies.ts` still calls `scanControllerAction`, which delegates to `resolveControllerActionContract`. Therefore the action semantics owner is not yet upstream-only.
2. `laravelControllerScanner.ts` still constructs a `ControllerResponse` candidate from `result.semanticJudgment.contract.response.responseTypeName()` before invoking integrated response judgment. This remains a response-candidate ownership issue; the integrated response pipeline is wired later in the scanner and is not yet the sole owner of all method-response projections.
3. Transitive imports from the scanner still reach controller subscanners and relation helpers. No claim is made that `relation`, `foundation`, or subscanner dependencies have been eliminated.
4. Build, TypeScript typecheck, and Vitest are not run in this phase.

## Verification

Run `node scripts/audits/audit-phase2119-judgment-preserving-runtime-executor.cjs` from the RouteSync repository root. The audit is a static contract-shape check, not a substitute for compilation or behavioral tests.

## Transitive import-closure trace

A source-level relative-import walk from these two entry points was performed:

- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`

Observed closure: **416 modules and 2,173 resolved relative import edges**. This is a static relative-import walk (not a full TypeScript module-resolution graph).

The closure still reaches the following relevant dependencies:

- `packages/core/src/semantic/relations/relationFoundation.ts`
- `packages/core/src/semantic/relations/semanticRelations.ts`
- `packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts`
- `packages/core/src/compiler/scanner/subscanners/controller/controllerBodyResolver.ts`
- `packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts`
- `packages/core/src/compiler/scanner/subscanners/resource/resourceSemanticMappingRelations.ts`

The walk found 36 filenames/paths matching `relation` and 20 paths under `subscanners`; only one path matched `foundation` by filename/path, namely `relationFoundation.ts`. These counts are naming/path matches, not a semantic classification of every dependency. They demonstrate that this phase has **not** achieved the requested relation/foundation/subscanner-free closure.
