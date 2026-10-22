# Phase 1905 — Laravel Controller Response Composition Interface-First

## Scope

This phase continues from Phase 1904. It fixes a misleading ownership statement around the invocation judgment and the integrated response, and moves the concrete response-composition singleton out of the analyzer and into the scanner wiring root.

## Trace result

The canonical `LaravelControllerInvocationSemanticJudgmentInterface` owns the controller source identity and the exact PHP-source invocation integration outcome at `judgment.response`.

`InvocationSemanticIntegratedResponseCompositionInterface.integrate(...)` takes the semantic knowledge graph plus that exact PHP-source outcome. Its result is a distinct knowledge-bound aggregate: it carries a publication response and retains the source outcome under `response.phpFunctionInvocations`. Therefore, the composed response is **not type-identical** to `judgment.response`; the source outcome is preserved inside the aggregate rather than replaced or reclassified.

Production trace:

1. `controllerVariableSemanticRuntimeBinding.ts` binds the upstream `invocationSemanticIntegratedResponseComposition` implementation.
2. `createControllerDataflowAnalyzer` now receives only the `InvocationSemanticIntegratedResponseCompositionInterface` contract and calls `responseComposition.integrate(...)`.
3. `invocationSemanticPipeline.ts` constructs the aggregate and forwards the exact input as `phpFunctionInvocations: input.phpSourceInvocationPipeline`.
4. `ControllerDataflowAst` retains both the source-correlated canonical judgment and the knowledge-bound composition result. They represent related but non-identical semantic layers; neither is silently substituted for the other.

## Interface changes

- `InvocationSemanticIntegratedResponseCompositionContract` advances from version 17 to 18 and states the source-outcome preservation/non-identity rule explicitly.
- `LaravelControllerInvocationSemanticBoundaryContract` advances from version 71 to 72. Its judgment and integrated-response ownership descriptions now distinguish the canonical PHP-source outcome from the composed publication aggregate.
- `controllerDataflowAnalyzer.ts` no longer imports the concrete composition singleton. The singleton is wired in `controllerVariableSemanticRuntimeBinding.ts`.
- Analyzer documentation now accurately states that semantic work remains in the analyzer; interface injection alone does not make it wiring-only.

## Remaining semantic runtime

The analyzer still owns statement-payload traversal, binding-to-AST correlation by source span, origin normalization, AST expression projection, variable grouping, and semantic-resolution orchestration. These are not declared solved by this phase. The next interface-first step must trace existing upstream owners for those operations, strengthen compatible contracts, and only then reduce the analyzer. Resource binding in `controllerDataflowContract.ts` remains a separate trace. No subscanner was deleted.

## Validation

Run:

```sh
node scripts/audits/audit-phase1905-laravel-controller-response-interface-first.cjs
```

Static audit result: 8/8. TypeScript build and tests were not run.
