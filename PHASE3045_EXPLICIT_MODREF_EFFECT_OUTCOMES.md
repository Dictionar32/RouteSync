# Phase 3045 — Explicit Mod/Ref Effect Outcomes

## Target

Raise direct PHP effect knowledge into typed upstream outcomes. Do not replace the old dispatch with a generic visitor, lookup table, or a second relation foundation.

## Runtime trace

`PHP AST → expression/statement syntax evidence producer → SemanticFact + source-backed mod/ref outcome → SemanticKnowledgeDataFlow → semanticObjectIdentityOperations.modRefEvidence → invocation semantic pipeline → CLI manifest composition`

## Changes

- `SemanticModRefRelation` is now part of the canonical upstream vocabulary.
- Assignment producers emit a `mod` relation to the exact assignment target `KnowledgeId`.
- Property/array access producers emit a `ref` relation to the semantic access location.
- Assignment-target access is not incorrectly emitted as a read; the enclosing assignment emits the write.
- `unset` emits a write relation for each target, preserving target identity and source span.
- Invocation effects remain blockers until a callable effect summary is modeled. No inferred callable effect is fabricated.
- `SemanticKnowledgeDataFlow` carries both concrete `modRefRelations` and source-backed unresolved `modRefFacts`.
- The object-identity consumer returns a partial assessment when known effects coexist with unresolved invocation effects.

## Explicitly not claimed

This is not global removal of `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, empty arrays, `??`, ternaries, `if`, `===`, `is`, `as`, lookup, visitor, `switch`, `map`, or exported functions across the repository. Parser boundaries and unrelated legacy paths still contain these forms. No deleted relation foundation was restored.

Full repository typecheck, full Vitest, and end-to-end CLI-to-manifest execution remain unverified because the workspace retains imports to intentionally deleted relation foundations. The focused upstream mod/ref test and targeted strict typecheck are the verified scope.
