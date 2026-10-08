# Phase 1205 — Upstream Capability Evidence Wiring

## Boundary repair

The route capability authority is now queried at one explicit wiring point:

`boundaryInputResolution.ts`

It produces a closed `RouteCrudRoleResolution` and passes both the role and its evidence into the capability resolver.

`capabilityResolution.ts` no longer calls `routeCapabilityAuthority`.

`capabilityBuilder.ts` no longer calls `routeCapabilityAuthority`; it only packages the already-resolved `RouteCapabilityCrudEvidence` into `RouteCapabilityContract`.

## Intended topology

```text
Laravel route/controller/action evidence
        ↓
upstream routeCapabilityAuthority
        ↓
RouteCrudRoleResolution { role, evidence, closed }
        ↓
boundary wiring
        ↓
capability resolver
        ↓
RouteCapabilityContract { evidence, derivation, provenance, closed }
        ↓
DataFlowAuthorityInterface
        ↓
manifest / graph / IR / CLI
```

No downstream layer is allowed to re-query semantic authority.
