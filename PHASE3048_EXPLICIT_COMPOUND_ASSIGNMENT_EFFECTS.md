# Phase 3048 — Explicit Compound Assignment Effects

## Goal

Raise compound-assignment knowledge into the upstream ADT. The model must not compress a read and a write into one `mod-ref` relation and force consumers to infer both effects.

## Domain change

`SemanticAssignmentEffectDefinition` now owns a typed `projection` operation. The `write` definition projects one `mod` relation. The `read-write` definition projects two separate relations: `ref` followed by `mod`. The assignment identity, target `KnowledgeId`, and `SemanticSource` come from the same canonical `SemanticAssignment`.

The effect operation is an explicit object property on the domain definition. It does not add a generic visitor, lookup table, or local switch to classify the operator downstream.

## Runtime trace

`PHP AST → expression/statement evidence producer → canonical SemanticAssignment fact → operator.effect.projection.project(assignment) → adapter relation continuation → SemanticKnowledgeDataFlow.modRefRelations → semanticObjectIdentityOperations.modRefEvidence → invocation semantic pipeline → CLI manifest scan operation → controller-invocation manifest composition`.

## Verification

Run `npm run audit:phase3048-explicit-compound-assignment-effects` for the static audit. Targeted strict TypeScript checking and the two focused compiled tests are run separately; repository-wide typecheck, all Vitest tests, and CLI-to-manifest end-to-end are not claimed unless explicitly executed.

## Remaining limits

- Parser-boundary operator mapping remains.
- Exact PHP evaluation ordering, heap/indirect locations, and by-reference aliasing remain incomplete.
- Invocation effects without callable summaries remain explicit blockers.
- No deleted relation foundation is restored; `collections.ts` remains exactly one newline byte.
