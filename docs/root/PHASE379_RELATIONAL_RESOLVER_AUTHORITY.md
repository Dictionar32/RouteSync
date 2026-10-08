# Phase 379 — Relational Resolver Authority

Phase 379 continues the semantic-authority migration after Phase 378.

## Scope

The following production resolver boundaries were migrated from host-language control flow and absence sentinels to semantic relations:

- `packages/core/src/semantic/plugins/ModelColumnResolver.ts`
- `packages/core/src/semantic/plugins/ResourceGraphResolver.ts`
- `packages/core/src/semantic/plugins/VariableResolver.ts`
- `packages/core/src/semantic/plugins/variable/assignmentResolver.ts`

## Semantic model

Resolver dispatch now follows:

`metadata relation -> candidate relation -> lookup/presence witness -> semantic resolution`

Model-column lookup consumes the existing `Lookup` relation directly. Resource resolution uses a declarative rule catalog. Variable resolution composes `this`, assignment, and model candidates through relation selection. Assignment lookup consumes `ModelAssignmentIndex.lookupBinding()` rather than a host-language undefined sentinel.

## Absence policy

PHP `null` remains a valid source semantic atom. Absence is represented by tagged relations such as `Lookup.missing`, `VariableResolutionResult.not_found`, and `RelationOption.none`.

## Validation

AST/lexical authority audit for the four migrated files reports zero occurrences of:

`if`, `for`, `while`, `switch`, `.map`, `.filter`, `.reduce`, `.flatMap`, `undefined`, `??`, `null`, `===`, `!==`, `as`, `unknown`.

TypeScript `transpileModule` diagnostics: zero for all four files.

Full project type-check remains environment-blocked by missing `@types/node` and `vitest/globals` in the checkpoint dependency environment.
