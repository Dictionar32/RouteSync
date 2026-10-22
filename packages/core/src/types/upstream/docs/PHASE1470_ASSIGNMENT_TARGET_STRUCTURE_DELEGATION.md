# Phase 1470 — Assignment Target Structure Delegation

## Objective

Remove the runtime-supplied `splitTopLevel` callback from the canonical assignment-target query. The shared upstream token-structure interface now owns delimiter-aware top-level partitioning.

## Flow

`Source token evidence → ScannerTokenStructureInterface.partitionTopLevel → TokenPartitionJudgment → ScannerAssignmentTargetContractAlgebra → assignment-target judgment → runtime AST projection`.

## Contract changes

- Added `TokenPartitionJudgment<Token>` with `partitioned` and `malformed` cases.
- Added `partitionTopLevel({ tokens, separator, tokenValue })` to `ScannerTokenStructureInterface`.
- Partitioning preserves empty leading/trailing segments and separators nested inside `()`, `[]`, and `{}` are not treated as boundaries.
- Unbalanced delimiter evidence is returned as a malformed judgment instead of silently returning the unpartitioned source.
- Removed `splitTopLevel` from `AssignmentTargetQuery`; the canonical target algebra now delegates destructuring partitioning directly to the shared upstream interface.
- Runtime assignment-target wiring no longer injects its `splitTopLevel` adapter.
- Kept the deprecated compatibility facade's `splitTopLevel` member for older callers only; new canonical consumers do not depend on it.

## Validation

- Static architecture audit: 7/7 checks.
- Strict focused TypeScript check of the changed interface/algebra modules: passed.
- Full scanner typecheck is not clean due to pre-existing diagnostics in loop-statement wiring and semantic evidence/query producer modules; these are outside this phase's changed assignment/token-structure modules.
- Vitest was not executed because project dependencies are not installed in this workspace.
