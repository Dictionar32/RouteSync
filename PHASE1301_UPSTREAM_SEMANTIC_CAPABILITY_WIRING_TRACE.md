# Phase 1301 — Upstream Semantic Capability → Contract/Interface → Wiring → Generic Hooks/Axios

## Invariant

Every semantic decision has one upstream authority. Downstream SDK/React consumes a closed capability/reference and never reconstructs semantic meaning from HTTP methods or action-name strings.

## Canonical topology

```text
Laravel route/controller/request evidence
        ↓
Semantic reasoning / relation closure
        ↓
RouteCapabilityContract
        ↓
OperationIdentityCapabilityContract
        ↓
OperationIdentityProjectionInterface
        ↓
RouteDefinition runtime boundary
        ↓
EndpointCallable.$key / $queryKey
        ↓
TanStack Query / React hooks
        ↓
Axios transport
```

Dataflow follows the same boundary pattern through `DataFlowConsumerInterface` and `DataFlowProjectionInterface`, both using `UpstreamWiringInterface`.

## Changes

- Added `OperationIdentityCapability` upstream contract/evidence/interface.
- Added runtime-only `OperationIdentityReference` projection type.
- Added `OperationIdentityProjectionInterface` as explicit upstream→wiring→downstream boundary.
- Added operation identity, hook kind, and CRUD role projections to the SDK `RouteDefinition` boundary.
- CLI endpoint emission now carries those already-resolved capabilities instead of making SDK/React infer them.
- `defineApi` fails closed when operation identity or hook kind is absent.
- `EndpointCallable.$key` is now an operation-identity tuple, not `[group, action]`.
- `EndpointCallable.$queryKey()` owns query-key construction; React no longer spreads `$key` or reconstructs it.
- `generateHooks`, `createHooks`, and extra hooks consume `hookKind`; they do not classify GET/mutation from HTTP method.
- Extra CRUD toast selection consumes upstream `crudRole`; it no longer infers role from action-name prefixes.
- `useApiMutation` no longer treats `[group]` as an automatic semantic invalidation authority.
- Axios `HttpClient`, `Interceptor`, `Response`, and `Request` no longer use `any` at the transport boundary.
- Added `scripts/audit/semantic-ownership-coverage.cjs` with fail-closed checks for these semantic reconstruction frontiers.

## Remaining frontier

`packages/react/src/hooks/define/intentWrapper.ts` still reconstructs `AggregateCollection/cart` intent from runtime strings and object shapes. This is the next semantic authority to move upstream as a closed `DomainIntentCapability` rather than merely relocating the same branching.

`packages/sdk/src/api-runtime/optionSplitter.ts` and `schemaMapper.ts` still branch on HTTP method, but these branches are transport/schema-partition behavior, not hook/CRUD semantic classification. They should be migrated only when an upstream request execution capability is available; do not duplicate RouteCapability meaning merely to remove every method comparison.

The checked-in ecommerce `routesync.manifest.fresh6.json` is an older flat fixture: its route objects contain legacy `name/method/path` fields and do not materialize the canonical `identity`/`capability` objects. `ManifestSerializer` already preserves those canonical fields. The fixture should be regenerated rather than hand-patched if it is used as a golden manifest.

## External design alignment

MLIR interfaces are explicitly designed so transformations/analyses can operate without encoding concrete operation/dialect knowledge. CodeQL separates AST nodes from data-flow nodes and models data flow as a graph with closure operations. TanStack Query allows repository-wide narrowing of query keys through TypeScript `Register`. These support the RouteSync direction: semantic meaning is closed upstream, while downstream interfaces consume a stable typed projection.
