# Phase 1443 — Assignment Interface First

## Scope

This phase establishes the public assignment decomposition contract before changing the assignment algebra or scanner runtime. No runtime files are modified in this phase.

## Required flow

`Source token evidence → assignment semantic algebra → closed assignment judgment → interface → wiring → runtime executor → downstream AST projection`

## Contract boundary

`scannerAssignmentPartsInterface.ts` defines an index-free `ScannerAssignmentPartsInterface`, its query, and its closed judgment. A resolved result carries target/value classifications and the operator occurrence evidence (`before`, `token`, `after`). Malformed results identify a token or end-of-source rather than exposing a cursor index.

## Deliberate migration order

1. Define and review the public interface (this phase).
2. Make `scannerAssignmentPartsAlgebra.ts` implement this contract and enforce all operator/partition invariants.
3. Migrate scanner wiring to the interface without introducing a parallel runtime decision path.
4. Simplify runtime adapters only after the contract is authoritative.
5. Verify assignment AST projection and regression tests.

## Not claimed

The current assignment algebra still uses the legacy index-bearing contract. This phase does not claim assignment runtime migration, algebra conformance, a successful build, or runtime test execution.
