# Phase 769 — Canonical Security ADT, No Descriptor Replacement

## Frontier

The Phase 768 DTS frontier referenced `CanonicalRouteSecurityDescriptor`, which was not a semantic authority. The correction is not to introduce another descriptor. `RouteSecurityDescriptor` remains the single canonical security ADT in `types/upstream/route.ts`.

## Elevation

- Added `createRouteSecurityDescriptor` as the canonical constructor for the existing upstream ADT.
- Removed `RouteSemanticFlowSecurityDescriptor` compatibility class and `ScannedRouteSecurityParams` reservoir.
- `RouteSecurityClassifier` now constructs the upstream ADT directly.
- Security classification state uses closed `TruthValue`, `SecuritySchemeKind`, `Sequence<GuardName>`, and `Sequence<AbilityName>`.
- Classification traversal uses the relational fold instead of host `for`/`map`/`filter`/`reduce`.
- `AbilityName` remains upstream-only and carries `StringValue`.

## Authority

```text
Laravel middleware evidence
  -> security relation classification
  -> RouteSecurityDescriptor (single canonical ADT)
  -> RouteSecurityResolution
  -> RouteCapabilityContract
```

No `CanonicalRouteSecurityDescriptor`, `ParsedRouteSecurityDescriptor`, or second semantic security descriptor is introduced.
