# Phase 1417 — Scanner Runtime Interface Algebra

## Trace and architectural decision

`packages/core/src/compiler/frontend/php/astClassifierRuntime.ts` previously owned two generic mechanisms:

- `findStatementEnd`: delimiter-depth transitions and semicolon boundary selection.
- `parseStatements`: cursor advancement, ignorable-token skipping, structured/simple candidate selection, and accumulation.

Those are scanner orchestration algorithms, not PHP grammar facts. Extracting their source without changing ownership would be a file move only, so this phase gives them generic contracts, a closed boundary-result ADT, and injected grammar capabilities.

## Implemented

- `types/upstream/scannerStatementBoundaryAlgebra.ts` owns delimiter-state transitions and returns `terminator | end_of_input` plus the final delimiter state.
- `types/upstream/scannerStatementSequenceAlgebra.ts` owns cursor progression, skip transitions, structured-vs-simple resolution, progress checks, and sequence accumulation. It is generic over token and statement types.
- `astClassifierRuntime.ts` now supplies PHP token observations and PHP-specific resolvers. It no longer implements delimiter-state recursion or statement-sequence recursion.
- `parseStructuredStatement` consumes the boundary supplied by the sequence contract rather than independently re-running boundary discovery.
- `package.json` retains `build: tsdown`; only an audit command was added.

## Why this is not just moving functions

The new algebra owns the reusable transition semantics. Runtime callbacks supply language-specific recognition, while the contract owns the sequencing and boundary laws. This keeps the interface independent of PHP AST types and keeps PHP grammar recognition in the scanner.

## Residuals

- The sequence algebra currently returns the accumulated prefix when a resolver violates monotonic cursor progress. A later hardening step should return an explicit `contract_violation` ADT with source-position diagnostics instead of silently truncating.
- The full TypeScript build and scanner fixture suite remain to be run in an environment with workspace dependencies installed.
- Remaining scanner-local semantic/rule ownership hotspots include expression and assignment classification, query evidence production, validation-rule resolution, route/controller/model/resource producers, and semantic AST evidence boundaries. Migrate each by decision ownership, not by wholesale file moves.
