# Phase 2029 — Array-access source judgment preservation

## Trace finding

`astClassifierRuntime.ts::classifyArrayAccess` consumed the upstream `matchTrailingDelimiter` judgment but converted its `malformed` variant into a generic `Error`. That boundary retained only interpolated text and discarded the structured delimiter judgment (location, expected token, and actual token).

## Interface-first change

- Added `ScannerAstSourceFailureInterface<Token>` and its closed `ScannerAstSourceFailureJudgment<Token>` ADT in `scannerAstSourceFailureInterface.ts`.
- The existing parser runtime now wraps the original malformed delimiter judgment in `AstSourceJudgmentFailureError`; it does not classify or reconstruct the source evidence.
- Exported the type contract from the upstream barrel.
- Kept `LaravelControllerInvocationSemanticJudgmentInterface` as the canonical invocation authority and preserved the exact integrated response judgment through `laravelControllerScanner.ts`.
- Did not add a relation/foundation subscanner.

## Scope boundary

This change covers malformed array-access delimiter evidence only. Other parser helpers still have legacy `RelationOption` and generic-`Error` paths. Those must be migrated one source judgment at a time, preserving their existing upstream judgments rather than widening this ADT with unrelated weak primitive fields.

## Verification

Run `npm run audit:phase2029-array-access-source-judgment-interface-first` to execute the 10 structural checks. This audit is not a substitute for a full TypeScript type-check or runtime test suite.
