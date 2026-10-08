# Phase 821 — Route Legacy Isolation

## Authority result

The active route construction path remains:

`RouteEmission -> RouteBoundaryContract -> RouteProducerInput -> routeProducer.produce() -> RouteAst`

`RouteSemanticFlowFactory` is no longer part of active route construction.

## Cleanup

- Removed `compiler/scanner/descriptors/route/routeMethods.ts`.
- Removed the factory's obsolete `resolveDomain` and `resolveSecurityAndPolicies` surface.
- Verified there are no references to the removed descriptor resolver helpers.
- Kept `RouteSemanticFlowFactory` temporarily because SDK fixtures/tests and explicit public exports still depend on it.
- CLI `RouteSemanticFlowFactory` references are a separate incremental-descriptor implementation and must not be conflated with the core factory.

## Next frontier

1. Migrate SDK tests from the core legacy factory to canonical semantic boundary construction.
2. Remove the core factory from public exports.
3. Re-audit descriptor reachability.
4. Delete the remaining core route factory tree only after reachability is zero.
