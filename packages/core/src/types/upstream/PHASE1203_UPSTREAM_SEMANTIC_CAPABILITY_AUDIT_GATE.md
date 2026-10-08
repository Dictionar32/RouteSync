# Phase 1203 — Upstream Semantic Capability + DataFlow Audit Gate

## Trace

```text
examples/ecommerce-shop-source Laravel routes/controllers/requests/resources/models
        ↓
scanner evidence / source model
        ↓
upstream semantic capability contract
        ↓
routeCapabilityAuthority
        ↓
DataFlowAuthorityInterface / DataFlowInterface
        ↓
wiring boundary
        ↓
manifest / graph / IR / CLI consumers
```

The important invariant is that a downstream consumer receives semantic meaning;
it does not rediscover CRUD meaning from method/path/action strings.

## Repairs

- Added `SemanticCapabilityContract` with explicit upstream authority, closure, and evidence.
- Strengthened `RouteCapabilityContract` with typed CRUD evidence.
- Added `routeCapabilityAuthority` as the canonical route CRUD semantic authority.
- Converted `RouteCrudClassifier` into a compatibility adapter that delegates upstream.
- Removed production CRUD classification calls from capability resolution and resolver-graph construction.
- Added `DataFlowAuthorityInterface` and `DataFlowCapabilityAuthorityInterface` as explicit read-only ownership boundaries.
- Strengthened the semantic data-flow adapter with `authority: 'upstream'` and `closed: true`.
- Made data-flow projection depend on `DataFlowAuthorityInterface` rather than execution capabilities.
- Added `scripts/audit/routesync-architecture.cjs` and `npm run audit:architecture` as a regression gate.

## External alignment

MLIR documents interfaces as a way for generic transformations/analyses to consume
semantics without hard-coding concrete dialect knowledge. CodeQL separates AST nodes
from semantic data-flow nodes and uses a generic data-flow solver over graph relations.
TypeScript 7's native port emphasizes preserving compiler architecture and semantics
rather than changing semantic ownership during the implementation migration.

## Verification

This phase uses source-level/static audit only. The workspace is intentionally not
built in the assistant environment.
