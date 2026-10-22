# Phase 1464 — Match Source-Partition Interface

## Scope

Interface-only hardening. This phase does not implement `scannerMatchExpressionAlgebra`, migrate `astClassifierRuntime.ts`, simplify runtime helpers, or change AST projection.

## Contract additions

- `ScannerMatchExpressionEvidence` preserves the complete body token sequence and any tokens between the closing subject delimiter and opening body delimiter.
- The query supplies `sameToken`, so the future algebra can prove partition identity rather than treating equal token spellings as identical evidence.
- The exact `=>` token is named `fatArrow`; it is no longer represented by an ambiguous generic `separator` field.
- The contract states how complete query tokens reconstruct from keyword, subject partitions, interstitial tokens, body partitions, delimiters, and remaining suffix.
- The contract states how each arm source reconstructs from its conditions or default token, fat arrow, value, and optional following comma.

## Architecture boundary

`ScannerTokenStructureInterface` remains the canonical authority for structural token lookup and delimiter evidence. `ScannerMatchExpressionInterface` consumes that capability but does not implement it. The match algebra must validate the invariants before runtime wiring is changed.

Lexical token spellings remain strings because they are observed source evidence. Semantic judgment identities and contract-failure categories remain typed `unique symbol` identities.

## Required next phase

Implement the match algebra against this contract and add tests proving exact token-identity reconstruction, nested separators, default-arm rules, malformed delimiter handling, and explicit contract-violation outcomes. Do not migrate runtime wiring until those tests pass.

## Validation boundary

This phase checks interface declarations, explicit source-partition invariants, and exports. It does not claim algebra behavior, runtime behavior, or a complete monorepo build.
