# Phase 829 — Route Canonical Consumer Cutover

## Trace

The canonical route semantic identity is nested under the closed `RouteIdentityContract`:

```text
RouteSemanticFlow
  identity
    coordinates
      name / method / path / runtimePath
    domain
      resource / domain / group
    parameters
  binding
  capability
  provenance
  contract
```

Several CLI consumers still addressed the pre-cutover flat identity surface. Those paths were rewired to the existing nested authority; no new model, adapter, or compatibility projection was introduced.

## Repairs

- `classifier/routeGrouper.ts` now reads `identity.coordinates.method`, `identity.domain.group`, and `identity.coordinates.runtimePath`.
- `semantic/ResponseResolver.ts` now reads canonical route coordinates for response identity and HTTP method.
- `semantic/responseGrouping.ts` now reads the canonical domain group.
- `semantic/responseIdentity.ts` now reads the canonical route name.
- `normalizer/entities/routeNormalizer.ts` now uses canonical coordinates and binding operation data rather than legacy flat route fields.
- `ManifestContractValidator.ts` now validates `binding.response` and uses the canonical route identity for diagnostics.
- `ir/domain/request-endpoint/endpointRefs.ts` now uses canonical route coordinates.
- `request-deriver/domainExtractor.ts` now uses canonical route domain/resource identity.

## Audit

- legacy route factory production consumers: `0`
- legacy route factory SDK test consumers: `31`
- `RouteBoundaryAdapter` source consumers: `0`
- preserved legacy factory files: present and empty
- `routeMutations.ts`: present and empty
- flat `route.identity.method/groupName/runtimePath/name/path/resourceName` production references: `0`

The workspace does not contain installed TypeScript/Vitest dependencies, so a full typecheck/test execution is not available in this extracted checkpoint. The static canonical-consumer audit passes.

## Next frontier

Do not create another route model. Continue wiring the remaining CLI consumers that still read legacy flat route fields (`response`, `groupName`, `actionName`, `crudRole`, `runtimePath`, etc.) to the existing nested `RouteSemanticFlow` contracts. After production reachability is clean, classify the 31 SDK factory-specific tests into canonical semantic tests versus obsolete legacy-constructor tests.
