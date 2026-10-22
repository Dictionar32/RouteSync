# Phase 1450 — Statement Boundary Interface First

## Scope

This phase establishes the public contract for statement-boundary reasoning. It intentionally does not modify `scannerStatementBoundaryAlgebra.ts`, `scannerStatementSequenceAlgebra.ts`, or scanner runtime wiring.

## Contract

`ScannerStatementBoundaryInterface` accepts `StatementBoundaryQuery<Token>`. The query contains the candidate token suffix and a token-value observer; it does not accept a numeric start cursor.

The closed `StatementBoundaryJudgment<Token>` has three variants:

- `terminator`: returns the statement partition, the terminating token, and the remaining suffix;
- `end_of_input`: returns the complete statement partition;
- `malformed`: returns source evidence location, expected/actual observations, and a typed delimiter failure reason.

The public contract does not expose numeric token indices or delimiter-depth counters. Cursor traversal remains a separate concern of the statement-sequence layer.

## Migration order

1. Define the interface and closed judgment — this phase.
2. Make the statement-boundary algebra implement the interface and enforce partition invariants.
3. Migrate statement-sequence wiring to consume partitions and adapt its own traversal cursor at the sequence boundary.
4. Remove duplicate runtime boundary reasoning and legacy index-returning boundary surface only after all consumers migrate.
5. Verify AST output and statement progression with runtime tests and the full build.

## Validation limits

The Phase 1450 audit is a static source-contract audit. No runtime behavior is changed in this phase, and the algebra and runtime are intentionally unchanged.
