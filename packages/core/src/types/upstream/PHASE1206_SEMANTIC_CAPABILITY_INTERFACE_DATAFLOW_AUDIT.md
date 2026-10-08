# Phase 1206 — Semantic Capability Interface Algebra + DataFlow Authority Audit

## Boundary

The upstream semantic capability contract is composed from typed interface facets:

- evidence
- derivation
- provenance
- closure

Route capability specializes the generic contract without moving semantic authority into resolver, graph, IR, or CLI consumers.

## DataFlow boundary

`DataFlowInterface` remains the producer/adapter execution surface. Downstream analysis policies and IR projection consume `DataFlowAuthorityInterface`, which is read-only, upstream-owned, and closed.

Only the semantic dataflow pipeline/runtime adapter retains the full execution interface because those components bridge/produce the canonical judgment.

## Audit invariants

`scripts/audit/routesync-architecture.cjs` verifies:

1. upstream capability authority exists;
2. Route capability is closed and evidence-bearing;
3. authority is explicitly upstream;
4. derivation/provenance/closure are interface-composed;
5. CRUD is resolved once at the wiring boundary;
6. resolver graph does not reclassify CRUD;
7. capability resolver/builder cannot query the semantic authority;
8. legacy CRUD classifier is not a production semantic dependency;
9. IR projection uses `DataFlowAuthorityInterface`;
10. analysis policies use the authority bridge rather than execution surface;
11. manifest exposes canonical data-flow input surface;
12. graph/IR/CLI do not perform CRUD classification;
13. upstream semantic types remain `any`-free.

The current static audit result is 31/31 PASS. The ecommerce fixture warning about a missing materialized `dataflowInputs` field is intentionally retained as a warning because the fixture must not receive fabricated semantic data.
