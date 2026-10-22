# Phase 1656 — Invocation Judgment Boundary

## Applied

- Renamed the public contract's `callableBoundary` field to the invocation-domain `judgmentBoundary` field.
- Made the contract describe a requested invocation semantic judgment, its model-owned derivation proof, and rejection before downstream projection.
- Bumped `INVOCATION_SEMANTIC_CONTRACT.version` from 11 to 12 and updated the existing version assertion.
- Extended the Phase 1655 audit with a check that the public contract no longer exposes the forbidden generic `callableBoundary` abstraction.

## Verified

- Existing Phase 1655 audit: 13 checks passed, 0 failed.
- `npm run build` could not start because `tsdown` is not installed in this workspace (`sh: 1: tsdown: not found`). This is an environment/dependency limitation, not a successful build.

## Explicit remaining limitation

This phase does **not** claim to complete the larger semantic-model redesign. `semanticJudgmentRuleCompiler.ts` still lowers law kinds through a generic registry into relation patterns. That is still a semantic-lowering layer and must be addressed in a subsequent source-level redesign; it was not disguised as solved by this boundary rename. The scanner and runtime executor remain delegators for the invocation path.
