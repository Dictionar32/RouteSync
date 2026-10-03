# Phase 577 — Build Trace: CLI Semantic Export Closure

## Scope

This phase closes two source-level errors identified in the existing TypeScript build inventory:

1. `ServiceResult` existed canonically in `types/upstream/service.ts` but was not exposed from the core public barrel consumed by CLI audit code.
2. `EchoGenerator` indexed `ROUTE_PARAMETER_TYPE_REGISTRY` with `RouteParameterType` as though the semantic type were a string key. The canonical route parameter type is an ADT. The generator now consumes the canonical `matchRouteParameterType` relation/visitor and handles the model variant explicitly.

No compatibility type or duplicate semantic vocabulary was introduced.

## Verification

The checkpoint environment does not contain the installed workspace dependency/type-definition set (`node`, React, fs-extra, etc.), so a full workspace `tsc`/`tsup` run cannot be claimed here. The attempted targeted TypeScript invocation was blocked before source checking by missing ambient dependency type definitions.

The changes were inspected against the canonical declarations and the stale error forms from the supplied `tsc(2).log`.
