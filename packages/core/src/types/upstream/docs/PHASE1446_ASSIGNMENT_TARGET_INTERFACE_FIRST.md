# Phase 1446 — Assignment Target Interface First

## Scope

This phase establishes the public semantic contract for assignment-target recognition. It intentionally does not modify `scannerAssignmentTargetAlgebra.ts` or scanner runtime wiring.

## Contract boundary

`ScannerAssignmentTargetInterface.resolve(query)` receives token evidence and typed semantic callbacks. Top-level operator discovery returns `TokenOccurrenceJudgment`; delimiter recognition returns `DelimitedTokenJudgment`; malformed judgments use `TokenEvidenceLocation`. The public contract therefore does not require an operator cursor index.

The closed judgment variants are:

- `resolved`: a target was recognized;
- `unresolved`: the evidence does not form a valid target;
- `malformed`: source evidence violates structural expectations and carries a token/end-of-source location;
- `contract_violation`: required structural evidence violates the interface invariant.

## Required migration order

1. Define and review the interface (this phase).
2. Implement its invariants in `scannerAssignmentTargetAlgebra.ts`.
3. Migrate scanner wiring to construct the query and consume the judgment.
4. Remove legacy index-bearing target results only after consumer audit.
5. Verify assignment target AST projection with runtime tests and a full build.

## Explicit non-claims

The current assignment target algebra still uses `slice`, cursor-bearing `TokenStructureResolution`, and an index-bearing malformed result. No algebra or runtime migration is claimed in Phase 1446. Build and runtime tests must be performed in a workspace with the project's toolchain installed.
