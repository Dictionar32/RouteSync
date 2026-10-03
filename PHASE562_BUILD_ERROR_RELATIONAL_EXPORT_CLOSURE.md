# Phase 562 — Build Error Relational Export Closure

## Trace source
The Phase 561 build log showed a broad family of missing relational exports, stale query/type imports, and one semantic lookup inference failure. The errors were repeated by the four tsup entry builds.

## Root cause
The relational substrate had split authority:
- `semantic/kernel/relationalSequence.ts` depended on `semanticRelations.ts` for primitives.
- `semanticRelations.ts` depended on `relationalSequence.ts` for `RelationOption`.
- compiler relational sequence had a second, incompatible sequence authority.
- consumers therefore imported the same semantic relation API from incompatible module surfaces.

## Changes
1. Added `semantic/kernel/relationFoundation.ts` as the dependency-free relation foundation for:
   - relation branching/resolution
   - equality/any/all
   - option witnesses and folds
2. Cut `semantic/kernel/relationalSequence.ts` away from `semanticRelations.ts` and made it consume the foundation.
3. Made `semanticRelations.ts` a facade over the foundation plus sequence projections; this removes the previous foundational cycle.
4. Added compatibility exports from `compiler/relational/sequence.ts` for the canonical semantic sequence operations.
5. Moved `solveCandidate` / `solveRewriteCandidate` consumers to `requirementSolver` instead of treating the sequence module as a solver authority.
6. Fixed `cycleDetector.ts` to import `createQueryKey` from `queryKeyFactory.ts`.
7. Fixed stale `toCamelCase` imports to the canonical resource-naming utility.
8. Corrected `ModelAssignmentIndex.lookupBinding` inference through the relation option contract.
9. Corrected upstream discovery matchers to materialize the known missing/empty witness instead of passing an un-narrowed union into a narrowed visitor.
10. Corrected `TypeEnvironment.resolve` to project the value from the first `(id, SemanticType)` witness.
11. Strengthened relation branch/option signatures with overloads so heterogeneous ADT branches infer as unions rather than collapsing to the first branch.

## Verification
- All modified files transpile individually with zero TypeScript transpile diagnostics.
- The latest source-level type trace no longer reports the Phase 561 missing relational exports, stale `createQueryKey`, stale `toCamelCase`, or the `modelNodes.ts:49` lookup error.
- Full `npm run build` was not executable in the checkpoint because `node_modules/.bin/tsup` and `node_modules/.bin/tsc` are absent. Therefore this phase does not claim a completed bundler build.
