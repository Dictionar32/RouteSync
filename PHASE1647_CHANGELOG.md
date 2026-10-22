# Phase 1647 — Extensible Rule Literal Domain

## Problem

The declarative semantic rule term encoded `string | number | boolean` directly. That narrowed the rule contract to a hard-coded primitive vocabulary and prevented domain-specific string literal unions or branded string identities from being carried precisely through the interface.

## Change

- Parameterized `SemanticJudgmentRuleTerm`, `SemanticJudgmentRelationPattern`, `SemanticJudgmentDerivationProgram`, and `SemanticJudgmentRuleDefinition` with `TAtom extends SemanticRelationAtom`.
- Parameterized the generic rule compiler so the atom vocabulary is preserved at the interface boundary while lowering to the existing relation engine.
- Added a strict TypeScript fixture proving a closed string-literal vocabulary and branded string identity can be expressed without widening to a primitive union.
- Added `audit-phase1647-extensible-rule-literal-domain.cjs`.

## Boundary

This extends the semantic-rule interface vocabulary, but does not claim to extend the underlying relational engine's atom universe. New runtime atom categories must also be introduced into `SemanticRelationAtom` and its equality/identity encoding deliberately; they must not be smuggled through a generic type parameter.
