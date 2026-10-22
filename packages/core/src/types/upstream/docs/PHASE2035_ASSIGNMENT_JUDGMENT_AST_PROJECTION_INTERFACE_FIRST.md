# Phase 2035 — Assignment Judgment to AST Projection, Interface First

## Trace finding

`parseAssignmentParts()` consumed the canonical `AssignmentPartsJudgment` but immediately folded `resolved` into `RelationOption` and converted `unresolved` into `none`. This erased the upstream reason and made the AST consumers operate on a weaker result than the semantic contract already provided.

## Change

`parseAssignmentParts()` now returns `AssignmentPartsJudgment` directly. `classifyAssignmentExpression()` and `classifyAssignment()` are projection boundaries: `resolved` is projected into the corresponding AST factory, `unresolved` remains a non-match for the existing AST rule interface, and `malformed` / `contract_violation` are forwarded through the existing `AstSourceJudgmentFailureError` with the original judgment intact.

The runtime does not reclassify assignment meaning or create another authority. It executes the closed judgment produced by `ScannerAssignmentPartsInterface` and projects it into the pre-existing AST representation.

## Scope and limits

- No relation/foundation subscanner was introduced.
- Existing Laravel invocation semantic judgment and integrated response authority paths were not replaced.
- The legacy compatibility overload in `scannerAssignmentPartsAlgebra.ts` remains and is a separate migration concern.
- Structural audits and syntax checks do not replace a full TypeScript build or integration test.
