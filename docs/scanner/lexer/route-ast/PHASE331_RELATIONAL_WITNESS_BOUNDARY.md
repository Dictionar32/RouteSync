# Phase 331 — Relational Witness Boundary for Expression Semantics

## Objective

Move expression/operator absence and assignment-target dispatch away from JavaScript
`Map.get`, nullish fallback, strict equality, and optional-handler dispatch.

## Changes

- Operator lookup in `phpAstSemanticKnowledgeDataFlowAdapter.ts` is now a
  `RelationOption` witness derived by relational lookup over the semantic operator index.
- Binary and unary expression projection consumes the operator witness with
  `relationOptionFold`.
- Expression case dispatch uses relation lookup + witness fold instead of `??` fallback.
- Assignment-target dispatch uses the same relation lookup/fold model.
- Existing semantic `RelationOption` infrastructure remains the authority for absence.

## Architectural boundary

```text
PHP syntax evidence
  -> typed candidate relation
  -> RelationOption witness
  -> requirement/refinement
  -> semantic fact
  -> dependency relation
  -> fixed-point closure
```

No source-language control construct becomes a semantic primitive. PHP `null` remains a
source-language literal vocabulary item where it is part of the syntax evidence; it is not
used as the JavaScript absence mechanism.

## Validation

- TypeScript parser diagnostics for modified expression/adapter files: 0.
- Workspace-wide `tsc` remains blocked by pre-existing missing environment dependencies
  (`@types/node`, `vitest/globals`, and package dependencies); this phase does not claim a
  clean full type-check.
