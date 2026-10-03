# Phase 590 — Relational Interpreter / Scanner Boundary Cutover

## Goal

Continue the semantic-authority migration below the scanner/resolver frontier.
This phase removes host keyed-state construction from type interning and replaces
structural type hashing with a relation/visitor evaluator.

## Implemented

### TypeInterner

`compiler/types/TypeInterner.ts` no longer uses a host `Map` or a constructor.
Canonical identity is represented by:

- `RelationIndex<string, SemanticType>`
- relation lookup witnesses
- immutable relation replacement
- `TypeInterner.create()` factory

All production scanner call sites that previously created `TypeInterner`
instances now consume the relation factory.

### TypeHasher

`compiler/types/TypeHasher.ts` is now a semantic visitor/relation evaluator:

```text
SemanticType
   -> visitor relation
   -> recursive semantic hash facts
   -> finalized type/hash relation
```

The previous constructor/`WeakMap` cache, host dispatch switch, array mapping,
and sorting pipeline were removed from this implementation surface.

### SemanticTypeResolver

The resolver orchestration boundary is now an immutable resolver object produced
by a relation factory rather than a class instance constructed through `new`.

## Research basis

The direction follows the same separation used by declarative semantic systems:

- WebAssembly validation defines validity with declarative typing constraints and
  derives an implementation algorithm afterwards.
- Souffle models analysis state as typed relations and derives execution from
  relation declarations/rules.
- MLIR PDLL represents rewrite matching declaratively.
- K expresses program meaning through rewrite rules.
- CompCert separates source/target semantics and proves semantic preservation.

## Important boundary

This phase does **not** claim the repository is globally free of host control
constructs. The AST audit intentionally exposes the remaining frontier.
The largest remaining scanner leakage is now descriptor construction and legacy
scanner factories; analysis/passes also retain independent construction paths.
Those require separate relation-domain migrations rather than a textual rewrite.

## Validation

- Changed TypeInterner, TypeHasher, and SemanticTypeResolver files transpile with
  TypeScript with 0 diagnostics.
- AST audit is stored in `docs/PHASE590_CONSTRUCT_AUTHORITY_AUDIT.json`.
- The full project type-check remains subject to the environment's missing
  `node` and `vitest/globals` type definitions, as in the previous phase.
