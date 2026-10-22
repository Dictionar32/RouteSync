# Phase 1945 Interface-First Trace

Trace path:

1. `controllerBodyParser.ts` accepts the closed projection context (`syntax_only` or `invocation_semantic_judgment`).
2. `controllerBodyAstTypes.ts` now expresses the resulting AST as two discriminated variants instead of representing the distinction only as a conditional `dataflow` property.
3. The semantic variant retains `ControllerDataflowAst` from `analyzeControllerDataflowWithInvocationJudgment`.
4. `ControllerDataflowAst` extends the existing upstream semantic judgment model, which retains `payloadJudgments`, `invocationJudgment`, and `invocationSemanticIntegratedResponse`.
5. The existing upstream authority remains the sole owner of binding correspondence, payload ambiguity, variable-flow composition, and integrated response publication.

No additional semantic authority or lookup API was introduced. The parser only publishes the discriminant matching the already selected projection context.
