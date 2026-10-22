# Phase 1486 — Boundary malformed judgment preservation

## Goal

Keep source-syntax failure as a closed semantic judgment. A malformed delimiter boundary is not an internal contract violation: the boundary algebra already proves malformed source evidence.

## Change

- `scannerStatementSequenceAlgebra` now projects `StatementBoundaryJudgment.kind === malformed` into `StatementSequenceResolution.kind === malformed`, preserving source cursor index and a diagnostic containing the boundary reason, expected evidence when present, and actual token.
- The existing sequence-algebra regression now asserts the malformed judgment instead of treating it as `malformed_boundary` contract violation.
- `contract_violation` remains reserved for invalid partitions, invalid cursor progress, and broken producer/consumer contracts.

## Authority flow

Source tokens → `ScannerStatementBoundaryInterface` judgment → sequence algebra projection → `StatementSequenceResolution` → scanner runtime error/reporting boundary → AST consumers. The runtime does not reclassify malformed delimiter evidence as a contract defect.

## Verification limits

Static source and test expectations were updated. Vitest and full build/typecheck are not claimed as passing because the source ZIP does not include installed dependencies, and the global TypeScript version does not match the project configuration.
