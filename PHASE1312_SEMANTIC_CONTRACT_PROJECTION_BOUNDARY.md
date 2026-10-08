# Phase 1312 — Semantic Contract Projection Boundary

## Trace outcome

This phase follows the operation identity and route capability contract from the upstream authority through CLI projection and React hook typing.

### Corrections

1. `packages/react/src/hooks/define/intent/groupHookResult.ts` no longer infers `updateSelf` response type from `update`, `put`, or `patch` aliases. It reads only the explicit `updateSelf` endpoint capability and otherwise remains `unknown`.
2. `packages/cli/src/generators/sdk/apiObjectEmitter.ts` no longer consults the HTTP-method keyed `CANONICAL_ACTION_MAP` to name generated contract/mapper identifiers. It applies casing to the already-closed `route.actionName`.
3. Removed unused `toActionName()` helper from `packages/cli/src/generators/names.ts`; that helper reconstructed action naming from method/path even though the live route grouper already consumes `route.capability.actionName`.
4. Added regression guards to `scripts/audit/semantic-ownership-coverage.cjs` and new `scripts/audits/audit-phase1312-semantic-contract-projection.cjs`.

## Ownership law

```text
Laravel route/controller/request/model/resource/schema evidence
  -> upstream semantic reasoning and relational authority
  -> closed RouteCapabilityContract / OperationIdentityCapabilityContract / DataFlowInterface
  -> explicit upstream-to-downstream wiring
  -> CLI + SDK + React projection
  -> generated Next.js artifacts
```

A downstream consumer may normalize an identifier for legal output syntax, render a closed discriminant, or dispatch over a closed algebra. It must not infer a missing semantic capability from method, path, endpoint aliases, CRUD conventions, or response-shape guesses.

## Boundaries not falsely declared complete

- `ClosedHookKind<T>` in React still extracts the closed `$def.hookKind` discriminant with a TypeScript conditional type. This is type projection of an upstream decision, not a method/action classifier; a future stricter API can carry an exact preclosed hook signature if consumer-side conditional extraction is deemed too much.
- `routePayloadLocationFromMethod()` remains in upstream `routeExecutionVocabulary.ts`, called by upstream `routeCapabilitySemanticAuthority.ts`. Its ownership is upstream, but the policy itself remains conventional method-based reasoning and should be replaced by explicit request/payload evidence if source semantics can establish that reliably.
- Legacy exports in `packages/cli/src/generators/canonical/actionMap.ts` remain for compatibility, but the live SDK emitter no longer uses the method-to-action map. The new audit focuses on live downstream paths, not merely the existence of compatibility exports.
- Build was not asserted: dependency installation state must be checked before running the full `tsdown` build.

## Repository trace anchors

- `examples/ecommerce-shop-source/routesync.temp.manifest.json` and `routesync.manifest.fresh6.json` each contain 35 route entries; the manifest stores route facts (`name`, `method`, `path`, schema/response/assignments) as source-derived input rather than the final React hook classifier.
- `examples/ecommerce-shop-source/frontend/routesync.ir.json` declares `ir.v2` with 109 nodes. `frontend/routesync.graph.json` carries 4 services, 28 controllers, 20 models, and 60 edges. These are graph/IR projections and should retain the provenance and capability decisions already made upstream.
- `packages/core/src/types/upstream/operationIdentityCapability.ts` is type-only; `operationIdentityCapabilityAuthority.ts` constructs the closed identity capability from route capability lineage.
- `packages/core/src/types/upstream/route.ts` carries `crudRole`, `actionName`, `hookKind`, `payloadLocation`, and execution signature as a route-specific capability contract. `routeCapabilitySemanticAuthority.ts` owns their resolution.
- `packages/core/src/types/dataflow/dataFlowInterface.ts` separates producer/execution interfaces from `DataFlowConsumerInterface`; internal semantic-dataflow pipeline/adapter files still use the full `DataFlowInterface` on the producer lane. Downstream consumers should use the authority-only consumer surface or explicit projection contracts.
- `packages/sdk/src/defineApi.ts` requires upstream `operationIdentity` and `hookKind` and builds `$key` from the identity reference. SDK request execution uses method as transport information; it must not infer hook/CRUD meaning from that method.
- `packages/cli/src/generators/classifier/routeGrouper.ts` takes `route.capability.actionName` and `crudRole`; `apiObjectEmitter.ts` projects operation identity, hook kind, payload location, and role into generated endpoint definitions. The Phase 1312 change removes the remaining method-map lookup in the emitter's naming path.

## External architecture alignment

- MLIR's interface model is relevant because generic consumers should depend on declared capabilities rather than special-case every concrete operation: https://mlir.llvm.org/docs/Interfaces/.
- CodeQL's data-flow model distinguishes the AST from data-flow nodes and supports tracing source-to-sink paths; RouteSync audits should similarly check semantic lineage, not only token presence: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/.
- Laravel resource routes/controllers provide source-side route/action evidence; RouteSync should resolve that evidence before target generation: https://laravel.com/framework/docs/12.x/controllers.
- Axios treats HTTP method, `params`, and request `data` as transport configuration. RouteSync should project the already-closed payload-location capability into those fields rather than making Axios/SDK decide semantic intent: https://axios-http.com/docs/req_config.
- Zod's schema validation and inferred static types support validation/projection of already-established request/response contracts, not route/action classification: https://zod.dev/.
- TanStack Query relies on typed query functions/options and their associated query keys; RouteSync should carry upstream operation identity into cache keys rather than rebuild identity from endpoint names: https://tanstack.com/query/latest/docs/framework/react/typescript.
- TypeScript 7.0 is a native port with a compatibility-oriented type-checking model; its speed is not a substitute for explicit semantic ownership or proof-carrying contracts: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/.
