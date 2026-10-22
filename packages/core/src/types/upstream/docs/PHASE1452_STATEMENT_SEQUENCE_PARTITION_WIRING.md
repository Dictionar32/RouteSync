# Phase 1452 — statement sequence partition wiring

## Scope

The sequence layer now consumes `StatementBoundaryJudgment` from the canonical
`ScannerStatementBoundaryInterface` contract. Its `findBoundary` callback receives
only the suffix beginning at the candidate statement; it no longer sends a numeric
start cursor into the boundary resolver.

## Ownership

- The boundary algebra owns delimiter reasoning and returns closed partition judgments.
- The sequence algebra owns traversal progress and validates that returned partitions
  cover the suffix without gaps or overlap.
- The runtime supplies the canonical boundary contract and consumes the statement
  partition for simple statements. Structured parsing receives the judgment and adapts
  the statement length to its existing parser cursor at the call boundary.
- The legacy index-shaped boundary facade remains exported for other compatibility
  consumers, but the statement-sequence runtime path no longer uses it.

## Validation

Tests cover complete end-of-input partitions, terminator advancement, malformed source
evidence, non-progressing resolvers, and rejection of incomplete partitions. Runtime
tests/build must still be run in an environment with the repository's test/build tools.

## Next phase

Phase 1453 should remove the remaining runtime helper indirection where safe, then
Phase 1454 should verify AST output and downstream consumers against real scanner input.
