# Phase 1431 — Upstream expression policy ownership

## Change

Structural expression candidate priorities now live in `scannerExpressionCandidateAlgebra.ts` as `SCANNER_EXPRESSION_STRUCTURE_PRIORITY`. The scanner runtime supplies syntax evidence and candidate resolvers, and reads priority through `scannerExpressionStructurePriority`; it no longer owns the numeric ordering. The policy is exported from the canonical upstream index.

## Boundary

`Source evidence → semantic reasoning algebra → closed judgment/contract → interface → wiring → runtime executor → downstream projection`.

This phase moves one concrete semantic policy across the boundary. It does not claim that all PHP expression reasoning has migrated: candidate predicates and AST construction remain in the language adapter/runtime and are follow-up work. In particular, the next step is to represent candidate applicability as explicit evidence/judgment outcomes rather than `RelationOption` alone, while preserving lazy evaluation and malformed-input diagnostics.

## Validation

Run `npm run audit:phase1431-upstream-expression-policy-ownership` and the existing Phase 1424, 1429, and 1430 audits. Full workspace build still requires the repository's declared build dependencies to be installed.
