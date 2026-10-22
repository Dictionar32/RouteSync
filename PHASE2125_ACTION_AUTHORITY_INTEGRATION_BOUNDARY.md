# Phase 2125 — Action Authority and Integrated Response Boundary

## Trace result

This phase follows Phase 2124 and inspects the real call path rather than treating a type/interface rename as a semantic migration.

### Action judgment path

`LaravelControllerScannerExecutor.scanControllers`
→ `executionDependencies.actionJudgment.judge`
→ `legacyLaravelControllerExecutionDependencies.actionJudgment.judge`
→ `scanControllerAction`
→ `resolveControllerActionContract`
→ canonical `ControllerActionContract`
→ `semantic` knowledge + `projection`.

The action judgment now has an explicit canonical knowledge surface, but semantic derivation is **not yet owned by a closed upstream authority**. `resolveControllerActionContract` still derives body resolution, return-set and response facts, request binding, constructor/method dependencies, dataflow, schema, and runtime return. Merely moving that resolver would not fix the ownership problem, so this phase does not pretend it has.

### Integrated response path

After method evidence has been produced, the scanner calls the existing `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` with the exact invocation judgment and declaration evidence. The response pipeline owns source correlation, response evidence production/binding, response semantic judgment, runtime execution, output projection, and AST projection. The exact invocation/response pair is retained on the final controller artifact.

This response is controller-wide and correlates evidence across the declaration's methods. It must not be flattened into each per-action `ControllerResponse` field: the per-action response ADT and the integrated response judgment answer different questions.

### Runtime executor

`LaravelControllerActionExecutionInterface.execute` accepts one completed action judgment and returns that exact judgment object. It does not infer action semantics from the compiler projection. This boundary remains appropriate.

## Interface evolution

The existing `LaravelControllerActionSemanticJudgmentContract` advances to version 3 and now makes two obligations explicit:

- integrated response ownership stays with the existing response pipeline;
- the production action-judgment adapter still delegates to the legacy resolver, so upstream semantic derivation remains an open migration boundary.

No parallel authority, `relation/foundation` layer, or replacement subscanner was introduced.

## Next upstream interface work — recommended order

1. Model the resolver's source evidence and its output as a closed, source-correlated action semantic judgment input/output contract, preserving the existing `ControllerActionContract` projection.
2. Identify and reuse existing owners for each semantic component before splitting anything: canonical return semantics, response-presence ADT, controller body/dataflow, request binding, dependency resolution, and schema projection.
3. Promote one semantic component at a time only where an existing upstream authority/ADT can be its actual owner; do not make the scanner or executor the classifier and do not relocate the whole resolver.
4. Keep the integrated response pipeline at declaration/controller scope, preserve every rejected/blocked response outcome, and preserve exact invocation judgment identity through AST projection.
5. Only retire `resolveControllerActionContract` after all semantic responsibilities have real upstream owners and the remaining resolver is demonstrably a projection/composition adapter.

## Verification boundary

The phase audit is static and checks the described call graph/contracts. It is not a TypeScript build, typecheck, or Vitest run; those were not run in this environment.
