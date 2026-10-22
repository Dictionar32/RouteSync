# Phase 1686 — Invocation Semantic Trace Witness Ownership

## Scope

This phase strengthens the invocation semantic model and its public interfaces before scanner wiring changes. The proof trace is now a discriminated union keyed by semantic rule identity. Each rule's `witnesses` member accepts only domain witness kinds owned by that rule; result and exception effect projections are distinct trace variants. The argument-form evidence rule intentionally cannot claim a derivation witness because its role is to retain the relevant typed obligation when positional semantics are unproven.

## Files changed

- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
  - Introduced `InvocationSemanticTraceRuleId` and rule-indexed witness ownership types.
  - Replaced the broad trace-entry interface with a discriminated union.
  - Advanced `InvocationSemanticContract` from version 30 to 31.
- `packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts`
  - Constructs each trace entry with rule-specific witness narrowing so the implementation conforms to the stronger interface.
  - No semantic derivation policy or scanner wiring was migrated in this phase.
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`
  - Updated trace ownership semantics and advanced pipeline contract version 7 to 8.
- `packages/core/src/index.ts`
  - Exports the trace entry union and rule-id type.
- `packages/core/scripts/audits/audit-phase1686-invocation-trace-witness-ownership.cjs`
  - Adds static checks for type-level witness ownership and the unchanged scanner/runtime boundary.
- `packages/core/package.json`
  - Adds `audit:phase1686-invocation-trace-witness-ownership`.
- Prior audit `audit-phase1677-invocation-semantic-algebra-implementation.cjs` and Phase 1681–1685 audits were updated to expect the current cumulative contract versions.

## Architectural boundary

The scanner remains a caller of `invocationSemanticRuntimeExecutor.executeAll(semanticKnowledgeDataFlow)`. This phase does not claim the entire invocation semantic implementation has moved behind the high-level pipeline interface. It strengthens the domain trace contract first; a later phase can wire authority and executor to this settled model, then reduce scanner responsibilities without using an incomplete contract.

## Verification

- Phase 1686 static audit: 10/10 checks expected to pass.
- Focused strict TypeScript check covers judgment interface, algebra trace construction, pipeline interface, and execution boundary contract.
- Full repository build is not claimed.
