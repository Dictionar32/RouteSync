# Phase 410 — Scanner Relational Positional Authority

This phase continues the migration from host-language control/positional primitives to semantic relations.

## Changes

- `requirementSolver.ts`: optional candidate collections are selected through `relationGate`; the solver no longer uses `||` as fallback authority.
- `routeBindingSemanticResolver.ts`: recursive positional traversal uses `relationAdvanceIndex` instead of direct index arithmetic.
- Exact `index + 123` production-code audit is zero.
- Existing `relationAdvanceIndex` remains the canonical positional relation; it is deliberately kept below semantic candidate/rewrite layers as transport navigation only.

## Architectural rule

Source syntax vocabulary such as `if`, `for`, `while`, or `switch` may remain as data when describing the input language. They must not become host-language semantic dispatch authority.

The intended pipeline is:

`scanner evidence -> semantic relations -> candidates/constraints -> solver -> rewrite witness -> canonical AST`

This follows the useful separation demonstrated by MLIR PDLL/PDL: matching and constraints are represented declaratively and rewrites are explicit, rather than encoded as procedural parser dispatch.
