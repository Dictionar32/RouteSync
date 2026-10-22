# Phase 1422 — Scanner assignment target algebra

Date: 2026-10-09

## Change

Moved assignment-target shape selection and recursive destructuring entry resolution from `astClassifierRuntime.ts` into `scannerAssignmentTargetAlgebra.ts`.

The algebra owns the order of target alternatives (destructuring, variable, append, array element, property, static property), recursive keyed/nested destructuring, variable/reference entries, and propagation of malformed token-structure evidence. Its contract is generic over token, expression, identifier, target, entry, and pattern types; it does not depend on PHP AST declarations.

The PHP runtime now supplies token observations, PHP expression/member/array/static-property recognition, and AST constructors. It maps the algebra's closed `resolved | unresolved | malformed` result into the existing scanner `RelationOption` boundary.

## Validation

- `scannerAssignmentTargetAlgebra.ts` passes focused strict TypeScript compilation.
- `astClassifierRuntime.ts` focused compilation shows no new errors in the migrated target-resolution block; the file still reports pre-existing unused declarations and unrelated errors elsewhere in the dependency graph.
- The repository Vitest dependency is not installed in this workspace, so the added Vitest test file cannot be run here.
- Full `npm run build` remains blocked by the missing `tsdown` executable.

## Boundary principle

The algebra owns generic target-shape decisions and recursive destructuring. PHP runtime remains the source of PHP grammar facts and AST-specific evidence; it no longer owns the recursive target-selection algorithm.
