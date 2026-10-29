# Phase 3071 Changelog

- Migrated scanner statement-control token and keyword judgments away from generic `continueWith<Result>` continuations.
- Introduced explicit `toScannerStatementControlJudgment` domain operations.
- Replaced the scanner control algebra's `Map` side channel with a named, typed keyword catalog operation.
- Preserved the public scanner interface and judgment outcome shapes.
- Added a focused audit script and package script.
- No claim of global primitive elimination, strict whole-program TypeScript success, or PHP-to-manifest end-to-end success.
