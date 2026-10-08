# Phase 1234 — Route Wiring Contract Alignment

## Finding

`RouteCapabilityProjectionInterface` already refined `UpstreamWiringInterface<RouteSemanticFlow, ClassifiedRoute>`, but its concrete `routeCapabilityProjection` value did not materialize the two architectural invariants required by the interface: `direction` and `upstreamAuthority`.

## Correction

The concrete wiring now explicitly declares:

- `direction: 'upstream_to_downstream'`
- `upstreamAuthority: 'upstream'`
- `project(route)` as the only materialization operation

This keeps semantic authority upstream while allowing the legacy `ClassifiedRoute` surface to remain a compatibility projection.

## Architectural law

```text
upstream semantic contract
        ↓
UpstreamWiringInterface
        ↓
downstream compatibility projection
```

The wiring layer does not classify, infer, or resolve semantic meaning.
