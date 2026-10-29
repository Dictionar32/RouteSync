# Phase 3047 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

This phase tightens the assignment-effect domain boundary. It does not claim that every primitive or control-flow construct has been eliminated repository-wide.

## Domain change

`semanticModRefEffectFactory.assignmentEffect` accepts a complete `SemanticAssignment` domain value. It derives the relation accessor from `assignment.id`, the location from `assignment.target`, the effect kind from `assignment.operator.effect.relationKind`, and provenance from `assignment.source`.

Both expression and statement producers now construct a single `SemanticAssignment` value, emit that same value as the canonical assignment fact, and pass the same value to the effect operation. This removes the previous repeated operator resolution and prevents independently supplied identity/target/effect/source arguments from disagreeing.

## Runtime trace

1. PHP assignment syntax reaches the expression or statement evidence producer.
2. The producer resolves one canonical assignment operator and constructs one assignment domain value.
3. The assignment fact is emitted into `SemanticKnowledgeDataFlow.facts`.
4. The same assignment value is passed to `semanticModRefEffectFactory.assignmentEffect`.
5. The resulting source-backed relation is recorded in `SemanticKnowledgeDataFlow.modRefRelations`.
6. `semanticObjectIdentityOperations.modRefEvidence` retains the relation in semantic assessment.
7. The integrated semantic result continues through the interface-backed CLI manifest scan and controller-invocation manifest composition path.

## Explicit limits

- The parser boundary still maps a closed syntax operator code to the canonical semantic definition. This is an explicit syntax-to-domain translation, not a claim of zero mapping.
- Compound assignment currently emits a `mod-ref` relation; separate read and write evidence has not been added in this phase.
- PHP by-reference aliasing, heap-location identity, and interprocedural callable effect summaries remain incomplete.
- Full repository typecheck, full Vitest, and end-to-end CLI-to-manifest execution are not claimed.
- Deleted generic relation-foundation modules remain deleted; `collections.ts` remains exactly one newline byte.
