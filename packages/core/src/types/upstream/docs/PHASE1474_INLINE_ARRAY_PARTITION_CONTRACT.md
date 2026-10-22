# Phase 1474 — Inline Array Partition Contract

## Trace

`astClassifierRuntime.ts` used a local `splitTopLevel()` adapter for inline-array entries. Although it consulted upstream delimiter discovery, it reconstructed segments itself and treated malformed delimiter evidence as a single unsplit segment. That was a runtime fallback instead of a closed structural judgment.

## Contract and migration

- The canonical API is `ScannerTokenStructureInterface.partitionTopLevel()` and returns `TokenPartitionJudgment<Token>` (`partitioned` or `malformed`).
- Its algebra delegates delimiter-aware candidate discovery to the same upstream token-structure authority.
- `classifyInlineArray()` now asks that interface for partitions and only performs AST projection on a `partitioned` result.
- Malformed delimiter structure now projects to `PhpAstFactory.unsupported(tokens)`; it is not reinterpreted as a valid one-element array.
- The runtime-local `splitTopLevel()` helper has been removed. Other runtime consumers are not claimed to be migrated by this phase.

## Validation

`node scripts/audits/audit-phase1474-inline-array-partition-contract.cjs` verifies the interface, algebra delegation, runtime wiring, fail-closed malformed branch, helper removal, and focused test coverage.

A Vitest test file covers nested delimiters, trailing commas, malformed delimiters, and empty source. Running Vitest/full package build requires the workspace's test/build dependencies; absence of those dependencies must be reported rather than treated as a passing test.
