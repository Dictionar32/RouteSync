# Phase 1903 — Laravel Controller Dataflow Interface-First Trace

## Scope

Continue from Phase 1902 without introducing a second invocation-judgment model, moving runtime functions to another file, or adding `semantic/foundation` dependencies. This phase changes the existing canonical `LaravelControllerInvocationSemanticBoundaryContract` in place (version 69 → 70); it does not wire a new runtime implementation.

## Trace findings

1. `LaravelControllerInvocationSemanticJudgmentInterface` is already the canonical closed judgment. Its `sourceFile` is the subject identity and its discriminated `response` is the exact integrated response. Do not add a V2 or reconstruct response provenance.
2. `ControllerDataflowAst` retains both the exact judgment and the integrated-response composition result. The same response is therefore present through a retained canonical judgment and a derived projection; the next trace must verify identity/reference preservation and whether consumers need both fields.
3. `controllerDataflowAnalyzer.ts` still owns semantic work despite its “thin scanner wiring” comment: it calls `produceSemanticKnowledgeDataFlow`, correlates binding facts to statement payloads, normalizes origins, maps PHP AST to upstream expressions, and invokes variable-semantic execution. It also imports `semantic/relations` directly. The comment currently overstates the implementation.
4. `semanticKnowledgeDataFlowProducer.ts` adapts PHP AST evidence into the canonical upstream `SemanticKnowledgeDataFlow`, but the producer's callable is still a scanner-local function rather than an injected canonical upstream authority contract.
5. `controllerDataflowContract.ts` still derives resource-binding candidates and calls `controllerResourceBindingAuthority`; this is another controller semantic boundary to trace after the analyzer, not a reason to move its functions into another file.

## Canonical interface improvement

The existing `LaravelControllerInvocationSemanticBoundaryContract` is evolved in place to version 70 with two explicit ownership rules:

- `controllerDataflowSemanticOwnership`: knowledge production, binding correlation, origin normalization, and variable semantic judgment must have complete upstream contracts before runtime can be reduced to wiring.
- `controllerDataflowIntegratedResponseOwnership`: the integrated response is the exact response nested in the canonical judgment and must not be recomputed or reclassified.

These are ownership gates, not a claim that the migration is complete. No parallel judgment/interface model was introduced.

## Required next interface-first work

1. Trace `semanticKnowledgeDataFlowProducer.ts` → `phpAstSemanticKnowledgeDataFlowAdapter.ts` → `producePhpAstSemanticKnowledgeDataFlow` and identify the strongest existing upstream semantic-dataflow contract to evolve; do not create a duplicate dataflow model.
2. Trace the existing upstream contracts for controller variable definition, origin, expression mapping, and semantic resolution. Improve the highest existing contract so these are represented as closed judgments/relations before changing analyzer wiring.
3. Reconcile `ControllerDataflowAst.invocationJudgment.response` with `invocationSemanticIntegratedResponseComposition` so the canonical judgment remains the single response authority and no duplicate composition is accidentally recomputed.
4. Only after those contracts are complete, migrate the analyzer to delegate. Do not delete subscanner files until all consumers and ownership boundaries are traced.
5. Trace `controllerDataflowContract.ts` resource binding separately and evolve its existing authority/interface rather than adding a second semantic path.

## Validation status

Static contract audit only. TypeScript build/tests were not run in this environment. Phase 1902's prior 12/12 static audit remains a historical result and is not evidence that Phase 1903's interface contract is typechecked or that runtime semantic leakage is fixed.
