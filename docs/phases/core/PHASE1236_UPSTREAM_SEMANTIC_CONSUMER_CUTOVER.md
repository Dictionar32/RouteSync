# Phase 1236 — Upstream semantic consumer cutover

This phase closes the remaining CLI route semantic reconstruction frontier found after Phase 1235.

## Rule

Downstream route consumers may use semantic capability values already resolved upstream, but must not recover semantic operation meaning from HTTP method/path literals.

## Cutover

`singletonGroupBuilder.ts` previously selected custom read/create/update fallbacks using `method === GET/POST` and `PUT/PATCH`. Those decisions now consume the upstream `route.capability.actionKind` contract:

- `read`
- `create`
- `update`

The route method remains available for projection/identity purposes; it is no longer used by this consumer as a semantic classifier.

## Boundary

```text
Laravel evidence
  -> semantic relations / reasoning
  -> RouteCapabilityContract
  -> RouteSemanticFlow
  -> UpstreamWiringInterface
  -> ClassifiedRoute compatibility projection
  -> CLI consumers
```

## Audit

`audit-phase1235-semantic-reconstruction-frontier.cjs` now detects both `route.*` and shorthand `r.*`/`freshRoute.*` method/path comparisons, while allowing identity/path use in naming and drift projection utilities.

No build is required for this phase. The audit is the structural validation performed in the workspace.
