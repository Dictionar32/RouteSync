# Phase 1904 — Laravel Scanner Interface-First: Upstream Evidence Contract

## Interface-first change

Evolved the existing `SemanticKnowledgeEvidenceAdapter<TEvidence>` boundary so its canonical contract is owned by `packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts`. The scanner-side module remains a compatibility wiring factory; the producer implementation and PHP AST evidence traversal were not moved or duplicated. `semanticKnowledgeDataFlowProducer.ts` now imports the type from upstream and keeps its existing public compatibility export.

The existing `LaravelControllerInvocationSemanticBoundaryContract` advances from version 70 to 71 and now explicitly records producer ownership and a runtime-reduction gate. This is an ownership correction, not a claim that `controllerDataflowAnalyzer.ts` is already thin.

## Trace findings retained

- `controllerDataflowAnalyzer.ts` still performs knowledge production, statement-payload correlation, variable-origin normalization, AST-to-expression mapping, and semantic resolution. It is **not yet wiring-only**.
- `semanticKnowledgeDataFlowProducer.ts` remains a PHP-evidence adapter. Its output type is the canonical upstream `SemanticKnowledgeDataFlow`.
- `invocationSemanticIntegratedResponseComposition.integrate(...)` computes a composed publication response from knowledge and the judgment's PHP invocation response. It is not type-identical to `judgment.response`; the previous Phase 1903 prose claiming the integrated response must be the exact nested judgment response needs consumer-level reconciliation before any removal. Do not silently replace one with the other.
- `ControllerDataflowAst` retains both `invocationJudgment` and `invocationSemanticIntegratedResponseComposition` output. Whether both are required must be established by tracing consumers.
- `controllerDataflowContract.ts` still owns resource-binding candidate traversal and remains a separate interface-first trace.

## Next interface work, in order

1. Trace all consumers of `ControllerDataflowAst.semanticKnowledgeDataFlow`, `semanticVariables`, `invocationSemanticIntegratedResponse`, and `invocationJudgment`.
2. Evolve the strongest existing upstream contract for binding-to-source evidence correlation; do not add a parallel dataflow model.
3. Identify whether variable origin, AST expression projection, and semantic resolution already have compatible upstream contracts. Strengthen those owners before wiring changes.
4. Reconcile response composition's actual type and authority with the canonical judgment. Preserve the judgment unchanged and avoid claiming the two responses are identical unless the types and authority path prove it.
5. Only then reduce analyzer runtime logic. Do not retire subscanners until production imports and consumers are traced.

## Validation

Static audit checks ownership location, compatibility export, contract version, explicit incomplete-migration gate, and no `semantic/foundation` dependency. TypeScript build and tests were not run in this environment.
