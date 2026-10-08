# Phase 262 — Declarative Semantic IR Lowering

## Goal

Continue the migration from syntax-shaped semantic dispatch to a higher-level semantic relation program.

The target boundary is:

```text
semantic fact
  ↓
semantic_kind relation
  ↓
declarative rewrite
  ↓
lowering_operation relation
  ↓
derived handler registry
  ↓
IR / output
```

The registry is an execution index only. It is not the semantic authority.

## Research basis

The design follows the same separation used by declarative compiler infrastructures:

- MLIR PDLL separates pattern matching from rewriting.
- MLIR declarative rewrites represent source/result patterns instead of embedding every transformation decision in imperative dispatch.
- MLIR's rewrite infrastructure repeatedly applies applicable patterns until a fixed point.
- CodeQL models semantic data flow independently from AST structure.

RouteSync applies the same principle at its semantic lowering boundary without making MLIR or CodeQL an implementation dependency.

## Migrated semantic boundaries

### Contract IR type lowering

`ContractIRTypeBuilder` no longer selects semantic variants with `switch`.

The relation program covers:

- primitive
- reference
- optional
- nullable
- collection
- object
- union
- literal
- unknown
- intersection

The last two preserve explicit unsupported/unknown behavior rather than inventing a target representation.

### Structured response lowering

`StructuredResponseIRBuilder` now derives the lowering operation for:

- resource
- model
- object
- primitive
- binary
- empty
- redirect

### Response field normalization

`typeNormalizer.ts` now resolves field-kind and resolved-type semantics through declarative relations.

### Nullable wrapper resolution

`wrapperResolver.ts` derives nullable-wrapper semantics through the same relation program instead of a semantic `switch`.

## Control-flow audit

The touched semantic modules contain zero occurrences of:

- `switch (`
- `if (`

Remaining loops/conditionals elsewhere in the repository are not automatically semantic authority. Parser/evidence decoding, validation, traversal, and solver mechanics remain separate concerns.

## Validation

Focused TypeScript compilation of the new relation/lowering modules passed with isolated type roots.

A runtime Vitest probe was attempted but timed out in the supplied environment; therefore this phase does **not** claim runtime-test PASS.

The broader workspace also contains pre-existing type/dependency failures unrelated to this phase.
