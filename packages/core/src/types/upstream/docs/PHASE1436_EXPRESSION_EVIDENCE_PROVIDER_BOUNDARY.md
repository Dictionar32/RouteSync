# Phase 1436 — Expression Evidence Provider Boundary

## Goal

Move PHP-specific compound-expression candidate construction out of `astClassifierRuntime.ts` while retaining a single upstream authority for deterministic arbitration and closed judgment construction.

## Resulting path

`TokenDescriptor evidence → phpExpressionStructureEvidenceProvider → resolveExpressionStructureJudgment (upstream) → ExpressionStructureJudgment → runtime executor → projectPhpExpressionStructure → AST value`

## Changes

- `phpExpressionStructureEvidenceProvider.ts` owns PHP-specific candidate declarations for short ternary, ternary, array access, call, root operator, and unary expression structures.
- `astClassifierRuntime.ts` now delegates candidate collection to that provider and only handles the closed judgment variants plus downstream AST projection.
- Candidate priority and deterministic arbitration remain owned by `scannerExpressionCandidateAlgebra` under `types/upstream`.
- The provider receives small scanner helpers through a typed service contract, avoiding a circular import from the runtime module.
- Historical audits were updated to assert the new provider-to-upstream path, and Phase 1436 adds a dedicated boundary audit.

## Deliberate remaining frontier

This phase does not claim that all semantic reasoning has left the language adapter. The provider still contains PHP-specific applicability callbacks, and malformed conditional/unary forms can still throw inside those callbacks. The next migration should replace thrown parse failures with a typed source-evidence outcome, then have upstream close that outcome into a judgment variant. Do not move PHP token knowledge into the language-neutral algebra; move the decision policy and judgment authority there.
