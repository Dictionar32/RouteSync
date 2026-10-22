# Phase 1445 — Assignment Wiring Contract

## Pipeline

`Source evidence → Semantic reasoning algebra → Closed judgment/contract → Interface → Wiring → Runtime executor → Downstream projection`

This phase migrates `parseAssignmentParts` in `astClassifierRuntime.ts` to the already-defined `ScannerAssignmentPartsInterface` query contract. It does not introduce a new runtime parser or a second semantic algorithm.

## Wiring changes

- The assignment call now supplies `locateOperator` through `scannerTokenStructureInterface.locateTopLevel`.
- Target classification converts the existing relational option into the interface's `Target | undefined` contract at the boundary.
- Value classification returns `undefined` for empty input and otherwise delegates to the existing AST classifier.
- Reference-marker recognition is supplied as evidence policy (`&`).
- Malformed judgments are handled using `TokenEvidenceLocation`, not an exposed numeric index.
- `scannerAssignmentTargetAlgebra` remains on its existing API; it is a separate migration boundary and is not silently changed here.

## Compatibility frontier

The legacy overload in `scannerAssignmentPartsAlgebra.ts` remains for older tests and callers, but the main runtime assignment wiring no longer invokes it. Removing that overload requires a complete consumer audit and migration of every remaining caller.

## Validation

The Phase 1445 static audit checks direct query wiring and ensures the assignment runtime call does not pass legacy `findTopLevelOperator`, `tokenValue`, or `slice` adapter fields. Regression tests cover compound assignment, reference assignment, and statement projection. Tests/build must be executed in a workspace with the project toolchain installed; static audit success alone does not establish runtime correctness.
