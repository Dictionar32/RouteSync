# Phase 1424 — Scanner Expression Candidate Algebra

## Scope

`classifyCompoundExpression()` previously computed all compound candidates eagerly before passing them to the semantic decision engine. That meant later candidates could perform structural scans or AST classification even after an earlier candidate would be selected.

This phase adds `packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts`, a language-neutral contract for deterministic, ordered, lazy candidate resolution.

## Ownership boundary

- The algebra validates candidate identity before executing any candidate.
- The algebra evaluates candidates in declared order and stops at the first resolved result.
- The algebra returns a closed `resolved | not_found | contract_violation` result.
- The PHP runtime supplies the candidate order, PHP token/grammar checks, recursive expression parsing, and `PhpAstFactory` construction.
- AST construction stays in the runtime adapter; candidate arbitration no longer does.

This is an algorithm migration, not an interface-only wrapper. The runtime no longer builds eager `OptionalSemanticCandidate` values for compound expressions.

## Validation

- Phase 1424 audit: 12/12 checks passed.
- Strict TypeScript check of the new candidate algebra plus expression-form, expression-operator, and token-structure algebra modules passed.
- Direct compiled JavaScript assertions cover lazy short-circuiting, no-result behavior, duplicate identity rejection, and preservation of the selected value.
- Full repository build remains pending because `tsdown` is unavailable in this workspace; Vitest is not installed, so the added Vitest test file was not run by Vitest.

## Next frontier

The remaining parser correctness work is to unify PHP operator facts and precedence across binary, null-coalescing, short-ternary, and full ternary forms without changing PHP-version semantics implicitly. Consult the official PHP operator-precedence table and keep PHP grammar/version facts in the language contract rather than hardcoding them into generic algebra.
