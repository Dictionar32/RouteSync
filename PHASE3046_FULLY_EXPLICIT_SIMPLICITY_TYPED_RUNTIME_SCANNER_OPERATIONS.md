# Phase 3046 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Goal

Continue the canonical runtime path from PHP syntax evidence through upstream semantic knowledge and the CLI manifest composition boundary. This phase targets one specific loss of domain knowledge: assignment operators were represented as a code, while their write-only versus read-write effect was resolved separately and could be re-inferred downstream.

## Model change

`SemanticAssignmentOperatorDefinition` now carries a `SemanticAssignmentEffectDefinition`. The named interface-first `semanticAssignmentEffectKnowledge` has two concrete outcomes:

- `write` → `mod`
- `read-write` → `mod-ref`

The canonical assignment operator catalog attaches the corresponding effect to every operator. `semanticModRefEffectFactory.assignmentWrite` accepts that domain effect and projects its `relationKind`; it no longer classifies the operator or searches a second effect catalog.

Both PHP assignment-expression and assignment-statement producers pass the operator's effect into the upstream factory. A plain `=` is therefore a write-only `mod`; compound assignments (`+=`, `.=` and other modeled compound operators) carry a `mod-ref` effect because they read the previous target and write the new value.

## Runtime trace

1. PHP syntax evidence producer sees an assignment operator.
2. The parser-boundary operator adapter resolves its canonical `SemanticAssignmentOperatorDefinition`.
3. The operator already carries the effect ADT.
4. `semanticModRefEffectFactory.assignmentWrite` emits the relation with the effect's explicit `relationKind`.
5. `SemanticKnowledgeDataFlow.modRefRelations` carries the result.
6. `semanticObjectIdentityOperations.modRefEvidence` preserves it in the analysis result.
7. CLI manifest scanning and controller-invocation manifest composition remain interface-backed downstream stages.

## Verification

- `audit:phase3046-assignment-effect-domain-operations` checks the typed effect model, both producer call sites, runtime route, deleted relation foundation absence, and the `collections.ts` one-newline invariant.
- `semanticAssignmentEffectDomainOperations.phase3046.test.ts` checks plain writes, compound read-write effects, target identity, and preservation in canonical assessment.

## Explicit limits

This phase does not claim global elimination of `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, `[]`, `??`, ternaries, `if`, `===`, `is`, `as`, lookup, visitor, `switch`, `map`, or function declarations. The syntax boundary still resolves parser operator codes to canonical definitions. PHP by-reference assignment, alias-sensitive heap locations, and callable summaries require their own source-backed models. Full repository typecheck, full Vitest, and CLI-to-manifest end-to-end execution are not claimed unless separately run.

No deleted relation foundation is restored. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
