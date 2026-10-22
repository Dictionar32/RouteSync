# Phase 1453 — Statement Runtime Executor Simplification

## Boundary

The canonical statement-boundary interface and algebra remain the sole authority for delimiter reasoning. The sequence algebra owns cursor progression and projects a validated statement partition to the numeric span required by legacy structured-statement parsers.

## Changes

- `ScannerStatementSequenceAlgebra` now passes `start` and `end` span coordinates to the structured parser callback, rather than passing the semantic boundary judgment into runtime.
- The sequence algebra computes `end` from the validated partition length. This confines compatibility cursor projection to the traversal/wiring layer.
- `astClassifierRuntime.ts` calls the canonical boundary contract directly in its sequence wiring; the redundant `findStatementBoundary` forwarding helper is removed.
- Simple statements continue to consume the actual token partition. Structured statement parsers still use their existing index-based AST parsing internals; that legacy parser representation is explicitly not claimed to be migrated in this phase.

## Pipeline

Source token evidence → `scannerStatementBoundaryContractAlgebra` → closed partition judgment → `ScannerStatementBoundaryInterface` → `scannerStatementSequenceAlgebra` validates partitions and owns traversal → runtime executes statement/AST parsing → AST consumers.

## Verification boundary

The audit checks ownership and wiring statically. A complete package build and Vitest run must be reported separately because this environment's workspace may not have `tsdown` or `vitest` installed. Downstream AST behavior requires runtime tests with real PHP snippets before the compatibility index span can be removed.
