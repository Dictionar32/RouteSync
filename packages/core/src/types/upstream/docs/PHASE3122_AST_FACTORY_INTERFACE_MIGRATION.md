# Phase 3122 — AST Factory Interface Migration

## Implemented slice

Migrated the AST sequence and derivation construction surface from four exported direct arrow factories to two explicitly typed operation objects:

- `AstSequenceFactoryInterface` / `astSequenceFactory`
- `AstDerivationFactoryInterface` / `astDerivationFactory`

The sequence interface exposes `empty`, `cons`, and `consWithEmptyTail`. The tail is explicit for `cons`; empty-tail behavior is represented by a named domain operation rather than a default parameter. Derivation construction accepts a complete `AstDerivationStepInput` datum, so premises, round, and tail are visible at the call site rather than hidden in defaults.

`AstSemanticSequenceFactoryInterface` / `astSemanticSequenceFactory` now provide the semantic-facing sequence operations as an interface-owned object. Internal AST evidence, relation facts, constraints, dependencies, diagnostics, and derivation construction use these objects. Legacy direct factory names and calls were removed from the TypeScript sources.

## Runtime trace

`createAstJudgment` → `astSequenceFactory` (source evidence and relation facts) → `astDerivationFactory.step` (proof datum) → immutable semantic AST judgment → existing AST projection.

The migration preserves the existing ADT discriminants, evidence values, relation ordering, source span, rule, witness, proof premise, round value, and empty derivation tail. It does not reintroduce the deleted relation-foundation modules.

## Static verification

Run:

```sh
node scripts/audits/test-phase3122-ast-factory-interface-migration.cjs
```

This CJS test statically checks the explicit interfaces, operations, call-site migration, and retirement of the old factory names. It is not a substitute for a full TypeScript typecheck or runtime integration test.

## Scope boundary

This is a concrete migration batch in the upstream AST domain, not a claim that every exported function and arrow in the repository has already been converted. The repository-wide export migration remains a sequence of domain-owned batches so callers and data contracts can migrate together without blind wrappers or semantic loss.
