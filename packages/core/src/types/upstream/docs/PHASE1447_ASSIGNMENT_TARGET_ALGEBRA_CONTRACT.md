# Phase 1447 — Assignment Target Algebra Contract

## Scope

This phase implements `ScannerAssignmentTargetInterface` in `scannerAssignmentTargetContractAlgebra`. It does not change scanner runtime wiring.

## Contract enforcement

- Top-level keyed destructuring uses occurrence evidence (`before`, `token`, `after`) rather than a semantic operator index.
- Leading destructuring uses delimiter judgments and source partitions.
- Malformed delimiter/operator evidence is returned with `TokenEvidenceLocation`, not a cursor index.
- The old `scannerAssignmentTargetAlgebra` entry point remains as a compatibility facade. It adapts the legacy callback contract and projects the canonical judgment to the legacy result; it does not own a second target-recognition algorithm.
- The interface algebra is exported through `types/upstream/index.ts` for the next wiring phase.

## Explicit frontier

The compatibility facade still accepts `slice` and an index-bearing `findTopLevelOperator`; those are isolated at the legacy boundary until scanner wiring migrates. Runtime changes are intentionally deferred to Phase 1448. Build and runtime tests must be run when the workspace toolchain is available.
