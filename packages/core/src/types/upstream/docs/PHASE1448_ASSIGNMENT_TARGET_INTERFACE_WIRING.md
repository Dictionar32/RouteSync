# Phase 1448 — Assignment Target Interface Wiring

The scanner runtime invokes `scannerAssignmentTargetContractAlgebra.resolve` with the index-free `AssignmentTargetQuery` contract.

- Runtime provides occurrence evidence through `scannerTokenStructureInterface.locateTopLevel`.
- Runtime provides delimiter evidence through `scannerTokenStructureInterface.matchLeadingDelimiter`.
- The assignment-target call no longer supplies a cursor `slice` callback or index-returning operator callback.
- AST-specific constructors and expression/member classifiers remain injected capabilities; target-shape reasoning stays in upstream algebra.
- The legacy `scannerAssignmentTargetAlgebra` facade is not used by runtime. It remains temporarily exported for compatibility and is deprecated.

This phase's static audit establishes wiring shape, not successful runtime regression or whole-project build.
