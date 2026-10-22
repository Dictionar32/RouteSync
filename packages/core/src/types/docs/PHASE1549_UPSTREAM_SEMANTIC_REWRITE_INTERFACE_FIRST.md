# Phase 1549 — Upstream Semantic Rewrite Interface First

## Scope

This phase moves the semantic-rewrite contract and its authority implementation out of the scanner subtree into `core/src/types/upstream`. The scanner import path remains as a compatibility facade for existing consumers. The foundation relation solver remains the single execution substrate.

## Contract elevation

- `semanticRewriteInterface.ts` defines tagged terms, relation facts/rules, execution requests, closed/incomplete judgments, and authority/runtime-executor interfaces. It does not import or run a solver.
- `semanticRewriteAuthority.ts` converts the protocol to the existing semantic foundation representation and asks `solveSemanticRelationsDetailed` for a result.
- `semanticRewriteRuntimeExecutor.ts` delegates only through `SemanticRewriteAuthorityInterface`.
- `scanner/lexer/routeAst/semanticRewriteInterface.ts` is now a compatibility facade. It retains the old `solveClosedSemanticRelations` call shape but delegates through the upstream runtime executor.

## Semantic model improvement

Previously, the scanner facade always returned `closed: true` and `closure: 'least_fixed_point'`, even if the foundation solver stopped at `maxRounds` before saturation. The contract now distinguishes:

- `status: 'closed'`, `saturated: true`, `closed: true`, `closure: 'least_fixed_point'`;
- `status: 'incomplete'`, `saturated: false`, `closed: false`, `closure: 'round_limit_reached'`, `reason: 'max_rounds_exceeded'`.

This prevents a partial computation from being represented as a proved semantic closure. The implementation reuses the canonical foundation solver; it does not create a second solver.

## Trace boundary / remaining work

`semanticConstraintCalculus.ts` still performs its own constraint filtering and calls `solveSemanticRelationsDetailed` from the scanner-side compatibility engine. It is an independent migration frontier and is explicitly not claimed as migrated by this phase. Next, trace its full consumer graph and determine whether its constraint semantics can be expressed through the same upstream authority contract without duplicating its calculus.

## Verification

The static audit checks the upstream contract boundary, executor delegation, scanner facade, truthfulness of closure status, and records the remaining calculus frontier. Build and runtime test status must be reported separately from the static audit.
