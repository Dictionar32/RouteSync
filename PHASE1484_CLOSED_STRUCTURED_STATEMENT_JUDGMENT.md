# Phase 1484 — Closed Structured-Statement Judgment

## Goal

Prevent a recognized structured PHP statement from silently falling through to simple-statement AST parsing when no structured rule resolves or the structured parse reports malformed input.

## Changes

- Replaced the structured callback's ambiguous `RelationOption<StructuredStatementResult<Statement>>` with `StructuredStatementJudgment<Statement>`:
  - `not_applicable`
  - `resolved`
  - `malformed`
  - `contract_violation`
- Added a `malformed` case to `StatementSequenceResolution`, preserving the diagnostic and token index.
- Updated `scannerStatementSequenceAlgebra` to branch exhaustively on the closed judgment. Only `not_applicable` may invoke `resolveSimple`.
- Updated `astClassifierRuntime.ts` so a recognized structured control with no matching rule returns `contract_violation` instead of an empty relation that previously enabled simple-statement fallback.
- Preserved existing AST creation in runtime; this phase moves the decision contract, not AST construction.
- Added regression tests proving malformed structured judgments do not invoke the simple parser and unresolved structured controls are contract violations.

## Architecture

`Source token evidence -> statement-control judgment -> StructuredStatementJudgment -> sequence algebra -> closed sequence resolution -> AST runtime projection -> downstream consumers`.

## Validation

- Static inspection confirms the only branch that invokes `resolveSimple` is `not_applicable`.
- Regression tests were added but not executed because the archive does not include installed dependencies. Full typecheck, Vitest, and package build remain unverified.

## Remaining boundary

Existing structured statement parser functions can still throw errors for malformed syntax. This phase prevents relation-based fallthrough and adds an explicit malformed result to the contract, but converting all parser-thrown syntax errors into typed malformed judgments requires a separate error-provenance migration. Do not claim that all malformed syntax is already returned as a value.
