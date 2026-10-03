# Phase 648 — Analysis Fixed-Point Unification

## Scope

This phase advances the compiler analysis frontier from host-language settling logic to the shared declarative relation fixed-point engine.

## Change

`packages/core/src/compiler/analysis/dataflow/backwardSolver.ts` previously implemented its own recursive settling boundary with an explicit round counter and termination expression. It now uses the same `relationFixedPoint` engine already used by the forward solver.

The analysis architecture is therefore:

```text
CFG relation
  -> seed relation
  -> deriveRound relation
  -> convergence witness
  -> relationFixedPoint
  -> settled analysis relation
```

No file was deleted.

## Unused-surface audit

A conservative production `.ts` scan found no additional non-empty file whose basename had zero references from the remaining production TypeScript corpus. No active file was vacuumed merely because its name or token vocabulary looked old.

## Research basis

MLIR canonicalization applies rewrite patterns iteratively until a fixpoint or configured bound and treats non-convergent rewrite cycles as defects. MLIR's pattern infrastructure separates pattern definition from pattern application. Souffle's recursive evaluation groups mutually recursive relations into SCCs and computes those components to a fixed point. Circular Reference Attributed Grammars combine non-local reference dependencies with recursive fixed-point equations and demand-driven evaluation.

## Boundary rule

Source-language constructs such as PHP `null`, `??`, ternary, or route `any` remain source evidence when they are part of the Laravel/PHP syntax model. This phase removes host-language control-flow authority from the analysis solver; it does not erase source semantics.
