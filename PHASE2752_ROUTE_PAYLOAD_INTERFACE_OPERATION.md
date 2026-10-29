# Phase 2752 — Route Payload Interface Operation

## Change

The route payload placement fallback is now exposed as the interface-typed runtime object `routePayloadLocationOperations`, with the contract `RoutePayloadLocationOperationsInterface`. The previous exported free function `routePayloadLocationFromMethod` was removed, and the semantic authority now calls `routePayloadLocationOperations.fromMethod(input.method)`.

```ts
export interface RoutePayloadLocationOperationsInterface {
  readonly fromMethod: (method: HttpMethod) => RoutePayloadLocation;
}

export const routePayloadLocationOperations: RoutePayloadLocationOperationsInterface = Object.freeze({
  fromMethod: (method: HttpMethod): RoutePayloadLocation =>
    method === HttpMethod.GET || method === HttpMethod.HEAD
      ? RoutePayloadLocation.Query
      : RoutePayloadLocation.Body,
});
```

The behavior is preserved: GET/HEAD select query placement; other methods use body placement. This is an explicit fallback policy, not a source-derived fact; the ADT continues to distinguish `http_method_fallback_policy` from `explicit_boundary`.

## Trace relevance

```text
routeCapabilitySemanticAuthority
  -> payloadLocationDecision
      -> explicit_boundary OR http_method_fallback_policy
          -> routePayloadLocationOperations.fromMethod(method)
```

This operation is an upstream route semantic authority dependency relevant to route manifest construction. It does not imply that every CLI manifest path invokes every route capability branch.

## Audit

Run `npm run audit:phase2752-route-payload-interface-operation`.
The audit verifies the named interface, typed frozen operation object, preserved method policy, updated consumer, and removal of the old function name from `packages`.

## Limitations

This is a targeted migration, not a repository-wide removal of exported functions. The full semantic typecheck, tests, build, and CLI E2E still require dependencies to be installed and run separately. The known transitive `semantic/relations` CLI dependency and incomplete independent 34-law verifier remain outstanding.

## Reference

TypeScript interface contracts and function call signatures: https://www.typescriptlang.org/docs/handbook/interfaces
