# Phase 827 — Route Consumer Cutover

## Objective

Continue the route migration by wiring boundary SSOT tests to the existing
`RouteBoundaryContractFactory`. No compatibility adapter, replacement model,
or second route authority is introduced.

## Changes

- `routeBoundaryContractSSOT.spec.ts` no longer imports `RouteSemanticFlowFactory`.
- `routeBoundaryContractSSOT.spec.ts` no longer references the removed
  `RouteBoundaryAdapter`.
- `routeBoundaryHardeningSSOT.spec.ts` no longer imports the legacy route
  factory or the removed boundary adapter.
- Both tests now assert the closed nested contract surface:
  `identity`, `binding`, `capability`, `provenance`, and `contract`.
- Existing `RouteBoundaryContractFactory` remains the construction authority.

## Authority

```text
RouteEmission
  -> RouteBoundaryContractFactory.create()
  -> RouteBoundaryContract
  -> RouteProducerInput
  -> routeProducer.produce()
  -> RouteAst
```

The legacy descriptor factory tree remains preserved as empty files. It is not
reintroduced as a compatibility layer.

## Remaining frontier

The remaining SDK tests still containing `RouteSemanticFlowFactory` are legacy
consumer surfaces. They must be migrated one contract at a time. The next
priority is `pureRouteDomainContracts.spec.ts`, which still references the
removed `RouteBoundaryAdapter` and also asserts the old flat contract shape.
