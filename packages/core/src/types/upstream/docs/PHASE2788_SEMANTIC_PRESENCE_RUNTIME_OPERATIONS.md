# Phase 2789 — Remove Semantic Presence Helper

The `semanticPresenceRuntimeOperations.fold` helper has been removed rather than retained as another abstraction layer. The canonical `SemanticPresence<T>` discriminated union remains the domain contract. Runtime consumers now narrow `kind` directly at the use site.

## Runtime path

- `phpAstSemanticKnowledgeDataFlowAdapter.ts`: branches directly on `effectiveGuard.kind` and appends a flow fact only when `candidateRelation.kind === 'present'`.
- `semanticEvidenceRelationCompiler.ts`: projects guard facts only when `flow.guard.kind === 'present'`.
- `semanticDataflowKnowledge.ts`: retains `SemanticPresence`, `semanticPresent`, and `semanticAbsent`; removes the fold interface, helper implementation, and operation object.
- `packages/core/src/index.ts`: no longer exports the removed helper.

This preserves the `present` versus `absent` ADT distinction and introduces no reasoning primitive, collection wrapper, or `Sequence`. `packages/core/src/types/upstream/collections.ts` remains empty.

Structural audit: `npm run audit:phase2788-semantic-presence-runtime-operations`. This audit does not prove full typecheck, build, or end-to-end CLI execution.
