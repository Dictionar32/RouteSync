# Phase 1516 — Closed Owned-Rule Execution Contract

## Intent

Strengthen the existing upstream semantic interface before changing scanner wiring. A method claimed by an upstream rule must not become `not_applicable` after its evaluator runs: doing so would erase semantic ownership and allow the scanner's legacy frontier to reinterpret the same method.

## Changes

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`
  - Added `QueryOperationSemanticRuleExecution`, a closed executor result union containing only `resolved` and `malformed`.
  - Clarified that `QueryOperationSemanticDecision.not_applicable` means no declared rule owns the source method; it is not an outcome of executing an owned rule.
- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`
  - Rule bindings now expose the closed execution result.
  - Added an adapter at the private executor boundary: if an evaluator unexpectedly returns `not_applicable` for an already claimed method, the authority returns `malformed` with a diagnostic rather than dropping ownership.
  - The public dispatch no longer maps an owned evaluator's result back to `unclaimed_query_operation_rule`.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`
  - Added a regression test that genuinely unknown method vocabulary remains explicitly unclaimed.
- `packages/core/src/index.ts`
  - Exported the new interface contract type.
- `scripts/audits/audit-phase1516-closed-owned-rule-execution.cjs`
  - Added a source-level boundary audit.

## Architectural effect

The semantic interface owns method-to-rule identity. Once ownership is established, the executor may only return a resolved AST or a malformed judgment. It cannot silently revoke ownership. This closes one authority leak at the interface/executor boundary and prevents scanner fallback from becoming a second interpreter for already-claimed methods.

This is a real boundary improvement, not yet a claim that evaluators are purely mechanical: individual evaluators still validate arguments and construct AST nodes. The next model-level milestone would be a typed derivation result that records which premises and constraints were actually discharged, rather than merely declaring them.

## Verification

Run `npm run audit:phase1516-closed-owned-rule-execution` and the prior phase audits. Full build/unit tests are only considered verified when run with the repository's pinned dependencies.
