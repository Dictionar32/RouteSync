# Phase 2032 — Loop Resolved Evidence Closure (Interface First)

## Trace finding

`ScannerLoopStatementEvidence` previously exposed `iterable`, `target`, and `clauses` as optional properties on one broad resolved evidence record. This allowed a `resolved` loop judgment to be structurally incomplete and forced the AST runtime to re-check evidence presence after the authority had already declared success.

## Contract correction

`ScannerLoopStatementEvidence<Token>` is now a discriminated union:

- `pretest_iteration` carries the shared header/body/source evidence;
- `counted_iteration` requires the three-part `clauses` tuple;
- `collection_iteration` requires both `iterable` and `target`.

The loop algebra writes the exact control discriminant on each resolved branch. The AST projection consumes the closed union through `projectLoopStatement` and no longer checks whether resolved evidence is optionally present.

## Boundaries preserved

- The existing `ScannerLoopStatementInterface` remains the authority.
- No relation/foundation subscanner is introduced.
- Laravel invocation judgment and integrated response wiring are unchanged.
- The runtime projects the already-resolved control-specific evidence; it does not reclassify source semantics.

## Verification

Run `npm run audit:phase2032-loop-resolved-evidence-closure-interface-first` from the repository root. This audit checks contract shape and integration boundaries; it is not a substitute for a TypeScript build or full type-check.
