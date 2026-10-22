# Phase 1510 — Query Semantic Reasoning Boundary

## Objective

Correct the ownership boundary exposed by Phase 1509: `queryProducerSemanticAlgebra.ts` contained method-family evaluation, malformed-evidence decisions, AST construction, and a long sequential dispatcher. Calling that file an algebra did not make those responsibilities declarative.

## Changes

- Moved the query producer implementation into `queryProducerSemanticReasoning.ts`, with the exported implementation explicitly named `queryProducerSemanticReasoning`.
- Kept the existing `QueryProducerSemanticInterface` contract unchanged. No parallel query interface was introduced.
- Kept `queryProducerSemanticAlgebra.ts` as a compatibility facade so existing consumers/imports continue to work.
- Replaced the hand-written sequential per-family dispatcher with `queryOperationRuleCatalog` and a generic rule-folding evaluator. Rule-family resolvers remain the semantic reasoning rules; the dispatcher no longer hardcodes a separate branch for every family.
- Exported the reasoning implementation from the existing upstream index and added a test asserting that the compatibility facade and reasoning implementation are the same object.

## Boundary after this phase

`queryProducerSemanticAlgebra.ts` no longer contains query reasoning. The actual query-specific semantic rules still contain procedural validation and AST construction inside `queryProducerSemanticReasoning.ts`; this phase does **not** claim to have converted those rules into a full declarative relation solver. It establishes the implementation boundary and generic rule dispatch as a prerequisite for that next step.

## Verification

Run `npm run audit:phase1510-query-semantic-reasoning-boundary` and the Phase 1500–1509 audits. Transpilation syntax checks are also run for changed TypeScript files. Full project typecheck/build/Vitest require the project's own dependencies and TypeScript version; do not infer their success from static audits.
