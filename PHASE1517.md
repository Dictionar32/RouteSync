# Phase 1517 — Family-Indexed Query Semantic Interface

## Intent

Strengthen the existing upstream interface itself. Rule-family identity must determine the minimum premise and constraint obligations at the TypeScript contract level, rather than relying exclusively on runtime catalog validation. This phase does not add scanner wiring or a new runtime executor.

## Changes

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`
  - Preserved tuple-level literal types in the canonical per-family requirement model.
  - Added `QueryOperationSemanticRuleFamily` and `QueryOperationSemanticRuleDeclarationFor<Rule>`.
  - Made the public `QueryOperationSemanticRuleDeclaration` a mapped discriminated union. The `rule` identity now determines its required premise and constraint tuple.
  - Kept runtime catalog validation as defense in depth for runtime/dynamic data.
- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`
  - Made the rule-declaration helper generic over the family identity so the declaration's obligations are checked against that family at compile time.
  - Kept evaluators private and did not move reasoning into the scanner.
- `packages/core/src/index.ts`
  - Exported the family-indexed interface types.
- `scripts/audits/audit-phase1517-family-indexed-query-interface.cjs`
  - Added an audit for the interface model and scanner authority boundary.

## Architectural effect

Before this phase, a declaration could be typed with any `QueryOperationSemanticPremise[]` and `QueryOperationSemanticConstraint[]`; correctness depended on a runtime validator noticing missing obligations. Now a declaration's rule tag determines its required obligation tuple at compile time, while runtime validation still catches dynamic catalog integrity problems.

This is an interface/model change, not a claim that rule evaluators are already pure executors. Evaluators still derive AST and validate evidence; the next semantic-model milestone must encode derivation witnesses and prove that obligations were discharged before a judgment can be considered closed.

## Verification

- Phase 1512–1516 source audits: run and report individually.
- Phase 1517 audit: run and report individually.
- Targeted TypeScript check: `queryProducerSemanticReasoning.ts` produced no diagnostics for the changed interface/reasoning files; unrelated existing repository diagnostics remain outside this targeted scope.
- Full project build and unit tests: not verified; repository dependencies are not installed in this workspace.
