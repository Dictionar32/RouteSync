# Phase 580 — Build Trace: Relational Type Closure

## Scope

This phase continues from Phase 579 without compatibility widening or global declaration hacks. The source frontier was inspected directly from the Phase 579 checkpoint.

## Root causes fixed

1. `compoundHandlers.ts` imported `relationResolve` twice from different semantic barrels. The duplicate import was collapsed to the canonical relational sequence export.
2. `ResponseFieldFlattener.ts` referenced the canonical `relationTextSlice` relation without importing it, and its semantic branches accessed discriminant-specific fields before establishing a type witness. The implementation now uses `relationRefine` + `relationOptionFold` for `known` / `verified` semantic witnesses.
3. `resolved-types/compounds.ts` widened `ObjectKind` through `{ kind }` when constructing nominal object identities. Each relation branch now emits the exact identity kind (`resource`, `model`, `response`).
4. `ConstraintSolver.ts` accessed union-specific `target` / `expected` fields after boolean checks. Constraint-variable extraction and subtype indexing now use explicit relation type witnesses and `relationOptionFold`.
5. `ConstraintSolver.ts` resolved optional type witnesses through `relationOptionFold` instead of direct `.value` access.
6. `UnionFind.ts` resolved parent links through `relationLookup` + `relationOptionFold`, removing the `number | undefined` leak from recursive closure.
7. `variableResolver.ts` materializes the existing immutable set through its canonical `values()` projection before constructing `UnionType`.
8. `SemanticTypeResolver.ts` now resolves verified resource-field semantics through a relation witness rather than direct discriminant-property access.

## Verification

- The modified files were passed through TypeScript's `transpileModule` with zero syntactic diagnostics.
- A project-wide `npm run build` could not be executed in this checkpoint because the extracted `node_modules` is incomplete: the `tsup` package/bin is absent despite package metadata being present. An attempted dependency restoration timed out.
- A global TypeScript 5.8.3 production-source check was run with a temporary type-root containing Node types. It still reports a broad migration inventory elsewhere; those errors were not masked or widened in this phase.
- The remaining reported production frontier includes compatibility/legacy boundaries, AST printer API drift, generator/domain migrations, and incomplete external dependencies. They are intentionally left for subsequent root-cause phases.

## Architectural constraints preserved

- No global `process` declaration was added.
- No `any`/`unknown` compatibility widening was introduced.
- No error suppression was added.
- Relation witnesses remain the semantic narrowing mechanism.
