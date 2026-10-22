# Phase 1638 — Invocation Single-Judgment Authority Binding

## Scope

- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
- `packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts`
- `packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts`
- scanner compatibility facade `packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts`

## Trace and finding

The interface already declares `InvocationSemanticAuthorityInterface.analyze(input) => InvocationSemanticJudgment`. However, the authority implementation still ran the aggregate analysis, selected one judgment, and synthesized the missing-invocation obligation itself. That made the authority more than a binding layer and left semantic closure behavior split between algebra and authority.

## Change

- Added `analyzeInvocationJudgmentAlgebra(model, invocation)` to the upstream semantic algebra.
- Moved the missing-invocation evidence obligation, proof, trace, and incomplete judgment construction into the algebra.
- Made `invocationSemanticAuthority.analyze` a direct typed binding to that algebra operation.
- Kept the batch aggregate operation explicitly separate for compatibility; the canonical one-in/one-judgment API remains `InvocationSemanticAuthorityInterface`.
- Preserved source evidence and rewrite proof when the requested invocation is absent from the semantic knowledge model.

## Validation

- Source trace confirms the authority facade no longer imports or constructs obligations/proofs and delegates the one-judgment request to upstream algebra.
- `tsc --noEmit -p tsconfig.json` could not validate the repository because this workspace has no installed dependencies and the available global TypeScript is 5.8.3, while the project config uses compiler options unsupported by that version; Node/Vitest type definitions are also absent.
- Existing `audit-phase1632-scanner-semantic-rule-ownership.cjs` reports 13/14 checks; its remaining check is stale and targets legacy names (`SEMANTIC_INTERPROCEDURAL_DATAFLOW_RULES` and `semanticInterproceduralDataFlowInterface`) rather than the current `invocationSemanticJudgment*` modules. This was not represented as a passing check.

## Boundary outcome

`Source evidence / typed semantic knowledge -> InvocationSemanticInput -> InvocationSemanticAuthorityInterface -> upstream single-judgment algebra -> closed or incomplete judgment with proof/obligations -> downstream projection`.

The runtime authority facade is now thin. The algebra still computes the batch rewrite closure internally before selecting a single judgment; optimizing the solver to execute only the requested invocation is a distinct follow-up and is not claimed as completed here.
