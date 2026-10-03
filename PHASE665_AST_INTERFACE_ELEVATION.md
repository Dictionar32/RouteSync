# Phase 665 — AST Interface Elevation

Phase 665 raises the semantic authority boundary from open implementation dispatch toward a closed algebraic interface model.

## Elevations

- `SemanticRewriteCandidate` now has explicit requirement, exclusion, and dependency relations. Semantic absence is no longer represented by optional candidate fields.
- Scanner token access now has a closed `TokenEvidence`/`tokenAt` relation interface; controller response/resource detectors no longer use optional token access or non-null assertions.
- `phpAstAlgebra.ts` now eliminates PHP AST variants through typed relational refinement rather than `as Extract<...>` assertions.
- Legacy `semanticRelationSolver.ts` and `syntaxErrorRelationCore.ts` remain empty compatibility remnants.
- The inactive-file vacuum remains authoritative and must stay empty after each elevation.

## Research alignment

The design is informed by MLIR interfaces and dialect conversion, K rewriting logic, Spoofax/Statix constraint and scope-graph semantics, SeaHorn Horn-clause verification, CompCert semantic preservation, WebAssembly WIT interface contracts, Maude rewriting logic, Flix/Datalog constraints, Nemo and Ascent relational rule engines, and circular/reference attribute grammar fixed-point evaluation.

The architectural synthesis is: closed ADTs/interfaces define the semantic vocabulary; relations define admissibility and dependencies; the rewrite engine derives stage results; fixed-point closure computes recursive graph/dataflow facts; proof obligations constrain cross-stage preservation; target projection is an interface contract rather than host-language control flow.

## Verification

- `node scripts/audit-phase665-ast-interface-elevation.cjs`
- `node scripts/audit-phase525-inactive-file-vacuum.cjs`
- Targeted `typescript.transpileModule` checks on changed files.
- Full `npx tsc --noEmit` remains environment-blocked when the repository lacks `node` and `vitest/globals` type definitions.
