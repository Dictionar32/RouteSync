# Phase 3123 — Explicit AST domain sequences

## Why this migration exists

The prior AST factory used `AstSequence<T>` and generic `empty<T>()`, `cons<T>()`, and `consWithEmptyTail<T>()` operations. That abstraction made AST domains appear interchangeable at the sequence-construction boundary and did not express which domain datum was being continued. It is not restored from, nor dependent on, the deleted relation foundation modules.

## Migration

The generic sequence alias and generic factory are replaced with closed, domain-specific sequence ADTs:

- `AstEvidenceFactSequence`
- `AstConstraintSequence`
- `AstDependencySequence`
- `AstWitnessNameSequence`
- `AstStringValueSequence`
- `AstDiagnosticSequence`
- `AstProofPremiseSequence`
- `AstRelationFactSequence`
- `ControllerMethodSequence`

`AstSequenceOperationsInterface` exposes named operations for each domain payload. The `AstSemanticRelationSequenceFactoryInterface` is narrowed to `AstRelationFactSequence`; it no longer provides a generic sequence bridge.

## Runtime trace

`createAstJudgment` constructs source evidence, relation facts, constraints, dependencies, proof premises, and diagnostics through the corresponding typed operations. The semantic projection consumes the relation-fact sequence through its explicitly typed boundary. This phase changes the upstream AST data-model construction boundary; it does not claim to complete every repository-wide export conversion or every CLI-to-manifest migration.

## Relation foundation constraint

This phase does not recreate `relationMembership`, `relationalSequence`, or `semanticRelations`. The legacy `astSemanticInterface.ts` still has pre-existing imports from those deleted modules in its closure engine and term conversion; those imports are outside this sequence-specific batch and must be migrated through the owning upstream semantic domain rather than by restoring the deleted foundation. A full project typecheck therefore remains unverified.

## Verification

Run `node scripts/audits/test-phase3123-explicit-ast-domain-sequences.cjs` for the static CJS gate.

## External references consulted

- TypeScript interface contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- PHP type declarations: https://www.php.net/manual/en/language.types.declarations.php
- Laravel controller routing and controller methods: https://laravel.com/framework/docs/12.x/controllers

These references ground the typed-contract approach and the PHP/Laravel source concepts; they do not imply that Laravel itself requires TypeScript-style interfaces.
