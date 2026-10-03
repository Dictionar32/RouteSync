# Phase 536 — Scanner/Resolver Relational Cutover

## Frontier closed

- `controllerReturnParser.ts`
- `memberCastsParser.ts`
- `routeSecurity.ts`
- `eloquentTypes.ts` cast resolver vocabulary
- `modelCastDescriptor.ts`

## Architecture

The closed surfaces now follow:

`scanner evidence -> semantic relation predicates -> candidate/witness relation -> recursive relation traversal -> canonical semantic output`

Return parsing uses recursive relation traversal for statement discovery and expression boundaries. Model casts use relation selection/projection/folding and a resolver vocabulary instead of an imperative mapper name. Route security construction uses relation gates and explicit property witnesses.

## Verification

- Phase 536 target audit: all forbidden surface counts zero.
- TypeScript `transpileModule` diagnostics: zero for every target.
- Repository `tsc` remains environment-limited by missing `node` and `vitest/globals` type definitions; no full-repository typecheck is claimed.
