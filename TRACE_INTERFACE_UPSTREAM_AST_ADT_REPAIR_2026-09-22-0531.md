# TRACE — Interface / Upstream AST / ADT — 2026-09-22

## Source of truth
`examples/ecommerce-shop-source` remains the Laravel source authority. Existing trace artifacts are diagnostic only.

## Trace finding
The canonical `RouteDefinition` already owns `capability: RouteCapabilityContract`, and `RouteEndpointContract` already has the same semantic owner. However, `routeNodeFromAst()` did not copy `definition.capability` into the endpoint contract.

### Loss boundary
```text
RouteDefinition.capability
    -> RouteAst.definition
    -> routeNodeFromAst()
    -> RouteEndpointContract   [LOSS: fixed]
```

### Repair
`routeNodeFromAst()` now explicitly preserves:

```ts
capability: definition.capability
```

No new descriptor or adapter was introduced.

## Secondary finding
CLI still contains legacy semantic projections such as `RouteManifest`, `Scanned*Descriptor`, `Record<string, unknown>`, and `as unknown as`. These remain migration targets; they were not converted into another parallel interface during this repair.

## Verification
- `RouteEndpointContract` contains `capability`.
- `RouteDefinition` contains `capability`.
- `routeNodeFromAst()` now forwards the same owner.
- No new descriptor/interface was introduced.
- Full TypeScript verification remains blocked by missing `@types/node` in the workspace environment (`TS2688`).
