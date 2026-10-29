# Phase 2728 — Fully Typed Controller Variable Runtime Binding

## Scope

This phase changes an active production boundary used by the PHP controller-body parser. It does not make an examples-only change and does not replace the upstream semantic authorities.

## Runtime source change

`packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts`

The exported free-function-style entrypoint `analyzeControllerDataflowWithInvocationJudgment(...)` is now a private implementation. The public runtime API is:

```ts
export interface ControllerVariableSemanticRuntimeBindingInterface {
  readonly analyze: (
    block: ControllerDataflowInput,
    parameterSemantics: ControllerParameterSemantics,
    judgment: LaravelControllerInvocationSemanticJudgmentInterface,
  ) => ControllerDataflowAst;
}

export const controllerVariableSemanticRuntimeBinding:
  ControllerVariableSemanticRuntimeBindingInterface = Object.freeze({
    analyze: analyzeControllerDataflowWithInvocationJudgmentImplementation,
  });
```

The production consumer in `packages/core/src/compiler/frontend/php/controllerBodyParser.ts` now invokes `controllerVariableSemanticRuntimeBinding.analyze(block, parameterSemantics, judgment)`.

The operation composes existing upstream authorities and evidence adapters: controller variable semantic authority, controller dataflow semantic judgment authority, PHP AST expression authority, source payload evidence adapter, definition projection authority, and semantic-knowledge evidence adapter. The result remains `ControllerDataflowAst`.

## Upstream CLI manifest trace retained

```text
CLI scan / sync
  -> composition.manifestScanOperation.scan(input)
  -> controller invocation manifest composition
  -> source project identity and route source selection
  -> controller-source discovery and source-document identity binding
  -> invocation semantic judgments and inventory validation
  -> manifest builder
  -> manifest_builder_complete | manifest_builder_blocked
  -> request/resource resolution preflight
  -> injected RequestType semantic pipeline
  -> routeManifestProjectionCompositionFactory.create(pipeline).project(...)
  -> manifest_projected | manifest_projection_blocked
```

Phase 2728 is a PHP controller dataflow wiring-boundary refactor; it does not change the manifest source authority, invent a RequestType fallback, or bypass the manifest builder's closed ADT.

## Audit

Run `npm run audit:phase2728-controller-variable-runtime-binding`. The script checks the interface-first API, the active parser call site, typed inputs/output, preserved semantic authority dependencies, and the upstream CLI manifest complete/blocked path.

## Known limits

The audit is static. Full project typecheck, all unit tests, build, and CLI end-to-end execution are not claimed as verified here. `relationFoundation` references elsewhere in the repository remain an open ownership migration; this phase does not recreate a foundation or add a replacement abstraction.
