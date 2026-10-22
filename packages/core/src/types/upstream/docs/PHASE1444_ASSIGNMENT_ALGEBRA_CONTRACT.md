# Phase 1444 — Assignment Algebra Enforces Its Interface

## Scope

This phase follows Phase 1443's interface-first definition. The assignment algebra now implements `ScannerAssignmentPartsInterface` and treats `AssignmentPartsQuery` / `AssignmentPartsJudgment` as its canonical semantic boundary. Scanner runtime wiring is intentionally unchanged in this phase.

## Contract enforcement

- A resolved assignment carries the operator occurrence partition (`before`, `token`, `after`) and no public cursor index.
- Operator rules with empty spellings or duplicate spellings produce `contract_violation`.
- Malformed token structure carries token/end-of-source evidence rather than an index.
- Empty operator sides, invalid targets, and empty values produce explicit unresolved judgments.
- The previous index-bearing call shape remains only as a temporary compatibility overload. It adapts its legacy search result into the canonical query, invokes the same judgment resolver, then projects the result back for current wiring. It does not own a second assignment decision algorithm.

## Migration order

1. Phase 1443: establish the public interface.
2. Phase 1444: make the algebra enforce it. Complete.
3. Next phase: migrate scanner wiring to pass `AssignmentPartsQuery` directly and consume `AssignmentPartsJudgment`.
4. Only after wiring migrates: remove the legacy overload and simplify runtime adapters.
5. Verify downstream assignment ASTs and run tests/build with the repository toolchain.

## Validation boundary

The static audit checks the interface/algebra boundary and confirms runtime source was not changed. The Vitest regression file is added but must be run when Vitest is installed. This phase does not claim a successful repository build or runtime test execution.
