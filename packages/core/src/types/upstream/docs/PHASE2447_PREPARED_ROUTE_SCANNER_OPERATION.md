# Phase2447 — Prepared Route Scanner Operation

## Root cause

The canonical source-AST pipeline already executed as a parameterless operation, but its route-scanner dependency still exposed `scan(input)`. The pipeline assembled controller judgment, route-binding authority, and route-selection intent at the call site and passed them into scanner execution. That made the downstream scanner a callable function rather than an explicit prepared operation.

## Change

- Evolved the existing `LaravelRouteScannerInterface` to expose `prepare(input)` rather than `scan(input)`.
- Added `LaravelRouteScanOperationInterface` as the explicit closed operation contract, carrying the exact `input` and authority/producer dependencies.
- Moved the route scan execution body into the prepared operation's `execute()` method, which accepts no arguments and reads its input/dependencies from the operation contract.
- Wired the active source-AST pipeline to `routeScanner.prepare(...).execute()`.
- Advanced the existing scanner contract version to 33 and exported the operation types.
- Added `audit-phase2447-route-scanner-prepared-operation.cjs`.

## Scope boundary

This phase closes the primary route-scanner executor boundary. It does not claim that every `const` arrow helper in `laravelRouteScanner.ts`, every downstream controller/resource scanner, or the route-emitter subscanner has been migrated into explicit upstream operation contracts. Those remaining helper/ownership boundaries need a separate evidence-led audit; do not treat this phase as a full removal of `semantic/relations` from the broader route-emission path.

## Validation

The focused prepared-operation audit and active pipeline blocker-order/response-blocker audits are the required checks for this phase. Full repository typecheck/build/Vitest/CLI E2E must be reported separately and are not implied by static audit success.
