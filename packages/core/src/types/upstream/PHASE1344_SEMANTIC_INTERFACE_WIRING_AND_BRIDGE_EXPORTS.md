# Phase 1344 — Semantic Interface Wiring & Bridge Export Closure

## Trace

The Laravel route semantic producer creates `OperationIdentityCapabilityContract` upstream. `RouteSemanticFlow` carries that closed capability. The CLI is a wiring/projection layer: `apiObjectEmitter` serializes the capability through `operationIdentityReferenceFromCapability`; it must not pass the broader route capability or reconstruct operation identity. The SDK runtime consumes the emitted identity and query-key projection; React/TanStack Query consumes the SDK's typed query key.

The example ecommerce frontend has a separate transport path: Axios is the HTTP client; `createCrudHooks` receives the service and query-key contract from its caller. It must not become RouteSync's semantic authority.

`DataFlowInterface<Input, State, Node>` remains generic execution/authority infrastructure. `SemanticReasoningContract` and closed capabilities own meaning upstream. `InterfaceDependencyBoundary` / `UpstreamWiringInterface` record the directional projection contract; graph structural relations remain separate from semantic data flow.

## Repairs

- Removed stale bridge-barrel exports (`CompilerBridgePipeline`, `ClientEmitters`, and nonexistent dependency aliases) and exported the concrete emitter list and actual pipeline functions.
- Fixed the SDK API emitter to pass `route.raw.operationIdentityCapability` into the operation-identity projection.
- Replaced an `any`-based bridge overload check with a structural type guard.
- Made Axios annotation imports explicitly type-only and typed example generic-hook query keys with TanStack Query’s `QueryKey`.
- Split `ASTNode`, `SymbolNode`, and `SymbolDatabase` into explicit type-only barrel exports; marked the legacy method-to-action helper as compatibility-only.
- Added `audit:phase1344-semantic-interface-wiring-and-bridge-exports`.

## Validation boundary

The Phase 1344 audit checks the contract topology and exact source-backed exports. Run `npm run build` with the repository's TypeScript 7.0.2 and tsdown 0.23.0 toolchain to verify bundling and declarations. The uploaded archive has no `node_modules`, so this workspace does not claim a full build result.

## External design references

- TypeScript Modules Reference — explicit `import type` / `export type` boundaries are erased from runtime JavaScript: https://www.typescriptlang.org/docs/handbook/modules/reference
- Laravel Controllers and Routing — route declarations carry method/URI/action evidence and resource routes may expand to multiple operations: https://laravel.com/framework/docs/12.x/controllers
- Next.js Route Handlers — the target runtime exposes supported HTTP method handlers in route files: https://nextjs.org/docs/app/getting-started/route-handlers
- MLIR Interfaces — transformations and analyses should consume generic interfaces rather than hard-code every operation/dialect: https://mlir.llvm.org/docs/Interfaces/
- CodeQL Data Flow — the data-flow graph models runtime value flow separately from AST syntax, with source/sink policy configured around a generic analysis: https://codeql.github.com/docs/writing-codeql-queries/about-data-flow-analysis/
- TanStack Query Keys — query keys identify cached query data and must include variables that affect the result: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- Axios TypeScript examples — Axios request/response declarations can be imported type-only: https://axios.rest/pages/getting-started/examples/typescript
- Zod Basics — schemas validate data and infer static TypeScript types: https://zod.dev/basics

These references support the separation of source evidence, semantic authority, generic interface/wiring, transport, and target projection. They do not establish that RouteSync's build passes; only the repository's own build can establish that.
