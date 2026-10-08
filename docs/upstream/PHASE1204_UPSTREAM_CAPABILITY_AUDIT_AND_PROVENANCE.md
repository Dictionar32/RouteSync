# Phase 1204 — Upstream Semantic Capability Audit and Provenance

## Authority direction

```text
Laravel source evidence
        ↓
upstream semantic capability authority
        ↓
SemanticCapabilityContract
  ├─ evidence
  ├─ derivation
  ├─ provenance
  └─ closed
        ↓
DataFlowCapabilityAuthorityInterface / DataFlowAuthorityInterface
        ↓
resolver / manifest / graph / IR / CLI consumers
```

## Repairs

- Resolver graph no longer derives CRUD role from `routeCapabilityAuthority`.
- Resolver graph consumes `RouteCapabilityContract.crudRole`.
- `SemanticCapabilityContract` now requires closed derivation and provenance metadata.
- Route capability construction records evidence, derivation strategy, and upstream provenance.
- Architecture audit now rejects semantic authority calls outside explicit capability-construction compatibility boundaries.
- Architecture audit increased to 26 invariants.

## Boundary rule

Semantic authority may construct a capability at the upstream/wiring boundary. Consumers must consume the closed capability contract and must not reconstruct semantic meaning from route method/path/action.

## External architectural alignment

MLIR interfaces are designed so analyses and transformations operate through generic interfaces rather than encoding knowledge of concrete operations. CodeQL similarly separates data-flow graph nodes from AST nodes and exposes generic global data-flow analysis. TypeScript 7 preserves compiler semantics through a methodical architectural port. Laravel routing/resource controllers provide the source evidence from which RouteSync derives route capabilities.
