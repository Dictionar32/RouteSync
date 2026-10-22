# Phase 1419 — Scanner Contract Evolution

## Scope

Evolve existing scanner contracts rather than add passive wrappers. This phase changes token-structure traversal ownership, closes statement-sequence outcomes, and removes duplicate assignment-operator searches.

## Changes

- `scannerTokenStructureAlgebra.ts` owns generic delimiter-aware top-level token search and reports `found`, `not_found`, or `malformed`.
- `astClassifierRuntime.ts` delegates `findTopLevelOperator` to that algebra. PHP-specific token observations and AST construction remain in the scanner runtime.
- `scannerStatementSequenceAlgebra.ts` now returns `complete` or `contract_violation`; invalid boundaries and non-progressing structured/simple parsers are explicit failures instead of successful partial prefixes.
- The runtime unwraps the sequence result and throws a diagnostic on a contract violation, preventing malformed partial AST output from being treated as successful parsing.
- `scannerAssignmentPartsAlgebra.ts` resolves each operator candidate once and carries the selected target/value evidence into result construction rather than searching the selected operator a second time.

## Boundaries

This phase does not claim to migrate all PHP assignment-target semantics, expression precedence, query semantics, or validation inference. Those remain follow-up work. The algebra is language-neutral; PHP grammar and AST constructors remain runtime capabilities.

## Verification

Run `npm run audit:phase1419-scanner-contract-evolution` and the focused Vitest tests under `packages/core/src/types/upstream/__test__`. Full build/typecheck must be run in an environment with repository dependencies installed.
