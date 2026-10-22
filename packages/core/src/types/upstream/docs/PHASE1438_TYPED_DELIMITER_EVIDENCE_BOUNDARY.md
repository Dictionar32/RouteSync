# Phase 1438 — Typed Delimiter Evidence Boundary

## Goal

Remove numeric sentinel contracts from the compound-expression evidence-provider boundary. The provider must receive `found`, `not_found`, or `malformed_source` evidence for array-access and matching-close observations, rather than interpreting `-1` or `tokens.length` itself.

## Flow

`PHP token evidence → scannerTokenStructureAlgebra delimiter validation → typed adapter evidence → scannerExpressionCandidateAlgebra arbitration → ExpressionStructureJudgment → runtime executor → AST projection`

## Changes

- Added `PhpExpressionIndexEvidence`, a closed union for indexed observations.
- Changed `PhpExpressionStructureEvidenceServices.findOuterArrayAccess` and `.matchingClose` to return typed evidence.
- Updated the array-access candidate to propagate malformed evidence as terminal input, return `not_found` only for absence, and construct a structure only from `found` evidence.
- Updated the call candidate to propagate malformed delimiter evidence and stop treating a numeric sentinel as a meaningful result.
- Added runtime-side evidence adapters that first ask `scannerTokenStructureAlgebra` to validate delimiters, then map legacy local index helpers into typed results. The legacy helpers remain for other scanner call sites; they are no longer wired directly into the expression evidence provider.
- Added a static boundary audit at `scripts/audits/audit-phase1438-typed-delimiter-evidence.cjs`.

## Authority boundaries

- PHP-specific token observations remain in the scanner adapter.
- Delimiter validation is delegated to the upstream `scannerTokenStructureAlgebra`.
- Candidate priority/arbitration remains owned by `scannerExpressionCandidateAlgebra`.
- Closed judgment formation remains owned by `scannerExpressionStructure`.
- Runtime does not perform candidate arbitration; projection occurs only for `structured` judgments.

## Limitations

The new matching operations validate only the delimiter path needed for the requested match. Other legacy scanner consumers still use numeric sentinel helpers and remain a migration frontier.

A focused Vitest suite was added for nested matches, missing delimiters, mismatches, and absence. The suite has not yet been executed in this workspace. The static audit is not runtime behavioral proof. `npm run build` could not run because `tsdown` is absent from this workspace (`sh: 1: tsdown: not found`). No build or typecheck success is claimed.
