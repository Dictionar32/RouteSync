# Phase 474 — scanner classifier relational cutover

This phase advances the scanner frontier toward native relational semantics.

## Cutover

- `astClassifierEvidence.ts`
  - compound-expression alternatives now use `OptionalSemanticCandidate` + `solveOptionalCandidate`.
  - array-access, function-call, unary, `instanceof`, and parenthesized classifier boundaries now expose `RelationOption` rather than nullable classifier results.
  - classifier rule catalog consumes those option-valued relations directly.
- `queryEvidenceProducer.ts`
  - remaining string slicing in query path construction was replaced by relational text-span operations (`relationTextSlice` + `relationAdvanceIndex`).
  - no imperative `if/for/while/switch` statement was introduced by the migration.

## Verification

- TypeScript source parsing: PASS for both touched files.
- Full typecheck: NOT claimed. The baseline has pre-existing semantic/type errors in the scanner/semantic kernel and the repository does not currently provide a clean full-project type environment.

## Architectural target

source/token evidence → candidate relations → requirements/constraints → fixed-point candidate solver → canonical semantic rewrite.
