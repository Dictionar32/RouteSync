# Phase 1235 — Semantic Reconstruction Frontier

## Canonical direction

Laravel/source evidence -> semantic relations -> reasoning algebra -> semantic contracts -> upstream authority -> wiring -> downstream projections.

## Contract hierarchy

- `SemanticReasoningAlgebraInterface`
- `SemanticReasoningContractInterface`
- `SemanticCapabilityAlgebraInterface`
- `SemanticCapabilityContractInterface`
- `SemanticDataflowAlgebraInterface`
- `SemanticDataflowContractInterface`
- `SemanticDataflowInterface`
- `UpstreamWiringInterface`
- concrete projection interfaces

## Route lane

`RouteSemanticFlow` is the closed route semantic projection. Its `capability` member is the authoritative `RouteCapabilityContract`. `RouteCapabilityProjectionInterface` is a downstream wiring specialization and must not derive CRUD meaning.

`ClassifiedRoute` remains a compatibility materialization. It is not semantic authority.

## Audit law

A downstream consumer violates the boundary if it reconstructs semantic meaning from method/path/controller/model names instead of consuming the closed contract. Pure target-lowering operations such as formatting a generated method name or selecting a route literal remain projection concerns.

The Phase 1235 audit intentionally distinguishes those two cases.
