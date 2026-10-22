# Phase 1449 — Assignment Target Downstream Contract

## Scope

This phase closes an in-repository consumer gap after Phase 1448 wired the scanner runtime to `ScannerAssignmentTargetInterface` through `scannerAssignmentTargetContractAlgebra`.

## Changes

- Migrated the legacy Phase 1422 regression suite to `scannerAssignmentTargetContractAlgebra` and `AssignmentTargetQuery`.
- Preserved coverage for variable targets, append targets, keyed/nested/reference destructuring, and malformed delimiter evidence.
- Marked the cursor-oriented compatibility facade and its public types as deprecated instead of silently deleting a potentially consumed exported API.
- Updated the interface's stale phase-boundary comment to reflect the current canonical algebra and runtime wiring.
- Added a downstream boundary audit for the judgment-to-AST projection.

## Architecture boundary

`Source evidence → Semantic reasoning algebra → Closed judgment/contract → Interface → Wiring → Runtime executor → Downstream projection`

The runtime is now a consumer of the canonical judgment. The deprecated compatibility facade remains exported only for compatibility; repository runtime and regression tests no longer use it. Removing the facade entirely is a separate public-API decision and should follow a consumer/versioning audit.

## Validation limits

The audit is static. It does not substitute for running Vitest, checking AST fixtures at runtime, or building the full repository with the project's installed toolchain.
