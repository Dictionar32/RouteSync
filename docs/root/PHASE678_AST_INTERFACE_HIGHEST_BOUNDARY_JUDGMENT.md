# Phase 678 — AST Interface Highest: Boundary Judgment + Construct-Free Catamorphism

Phase 678 advances the Phase 677 model from a clean set of selected authorities to a stronger **AST boundary judgment**.

## Model

```text
raw PHP grammar evidence
  -> typed grammar boundary
  -> PhpAstBoundaryJudgment
  -> canonical PhpAstNode ADT
  -> relational catamorphism
  -> scanner semantic evidence
  -> upstream mapping
  -> resolver graph closure
  -> analysis/type judgment
  -> TypeScript lowering
  -> target projection
```

## Changes

- Added `astBoundarySemanticInterface.ts` as a closed parser-boundary judgment. The parser tree is evidence; the canonical AST ADT plus derivation facts is the exposed authority.
- `nodeMapper.ts` now consumes `adaptPhpAstBoundaryJudgment(...).ast`, making the judgment the actual parser-to-AST handoff rather than documentation-only metadata.
- `boundaryAdapter.ts` removed host nullish fallback and `as unknown` from the selected boundary surface and routes absence through relation option/optional folds.
- `packages/core/src/types/domain/phpAst/algebra.ts` replaced host `if` and `.map()` traversal with relational dispatch/folding. The AST catamorphism is therefore construct-free at this interface.

## Audit trace

- Phase 677 authority audit remains the regression baseline.
- Phase 525 inactive-file vacuum was rerun: no inactive non-test TypeScript candidates.
- Phase 528 scanner vacuum was rerun: closed scanner targets remain clean.
- Phase 678 audit checks the upgraded boundary/catamorphism/semantic authorities and reports the remaining wider frontier instead of hiding it.

## Research alignment

The direction is deliberately closer to compiler IR interfaces and declarative semantic systems: MLIR uses interfaces to decouple generic analysis/transformation from operation-specific knowledge; CodeQL represents analysis facts relationally; Soufflé treats analysis as relations plus rules and fixed-point evaluation; egglog combines e-graphs with Datalog; Flix supports relation and lattice constraints with fixpoints; Maude makes rewriting logic an executable semantic specification; K makes rewrite rules and logical claims executable semantic objects. These are architectural inputs, not dependencies.

## Remaining frontier

The next migration should target the remaining production scanner/subscanner text-processing leaks (`length`, `split`) and resolver path conventions. They should become relation text vocabulary (`relationTextLength`, `relationTextFields`, `relationTextSlice`, prefix/suffix/path relations), leaving implementation primitives inside the semantic kernel rather than semantic authority modules.
