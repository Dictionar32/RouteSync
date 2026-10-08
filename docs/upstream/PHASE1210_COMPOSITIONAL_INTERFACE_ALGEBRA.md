# Phase 1210 — Upstream → Downstream Compositional Interface Algebra

## Canonical direction

Laravel source evidence -> upstream semantic authority -> closed semantic capability -> data-flow authority -> downstream projection -> manifest/graph/IR/CLI.

## Algebra

A boundary is directional and compositional:

`A -> B -> C`

where each interface consumes the previous contract and exposes a contract that may be consumed by the next stage. A projection must receive one upstream authority object; multiple project methods with unrelated inputs are intentionally avoided because they create a conflicting structural contract.

## Semantic capability

`SemanticCapabilityContract` is composed from identity, evidence, derivation, provenance, authority and closure facets. Identity is explicit; it is not widened to `unknown`.

## Security authority

Route security classification is upstream-owned through `routeSecurityAuthority`. The historical `RouteSecurityResolver` remains only as a compatibility adapter and production downstream code must not invoke `RouteSecurityClassifier.classify`.

## Data flow

`DataFlowExecutionInterface` is the producer/runtime surface. `DataFlowAuthorityInterface` is the closed, read-only downstream surface. `DataFlowCapabilityAuthorityInterface` composes the data-flow authority with the upstream semantic capability.

## Invariants

- semantic authority is upstream;
- downstream projections consume closed contracts;
- no CRUD/security reclassification downstream;
- identity is typed and explicit;
- no downstream consumer requires the full execution surface;
- manifest, graph and IR remain projections/materializations rather than semantic authorities.
