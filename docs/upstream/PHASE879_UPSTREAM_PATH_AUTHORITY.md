# Phase 879 — Upstream Path Authority

## Trace

```text
RouteDeclarationAst
  -> resolveRoutePath()
  -> ResolvedRoutePath
       - path
       - resourceName
       - parameters
       - runtimePath
       - constantKey
  -> RouteEmission
  -> RouteBoundaryContractFactory
  -> RouteSemanticFlow
  -> RouteManifest / downstream
```

## Cutover

`runtimePath` and `constantKey` are path-derived facts. They are now produced by the canonical `resolveRoutePath()` result and projected through `RouteEmission` into `RouteBoundaryOptions`.

The boundary remains the authority for assembling the complete route contract, but it no longer needs to rediscover those path facts when upstream already supplied them.

`deriveRouteConstantKey()` remains one shared derivation function and is reused by `resolveRoutePath()`; no duplicate constant-key algorithm was introduced.

## Validation

- `audit:phase839-route-single-scan`: PASS
- `audit:phase875-route-producer-upstream-wiring`: PASS
- `audit:phase876-route-boundary-single-authority`: PASS
- `audit:phase877-route-downstream-authority`: PASS
- `audit:phase878-route-downstream-authority`: PASS
- `audit:phase879-upstream-path-authority`: PASS
- 0-byte legacy files: 203
- deleted files: 0
