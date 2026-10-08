# Phase 1207 — Upstream → Downstream Interface Algebra

The semantic capability remains owned by `types/upstream`. Downstream projection is expressed by a separate, downstream-owned interface algebra:

`SemanticCapabilityContract -> SemanticCapabilityProjectionInterface -> downstream output`

For data-flow projections:

`SemanticCapabilityContract -> DataFlowCapabilityAuthorityInterface -> DataFlowCapabilityProjectionInterface -> downstream output`

The upstream contract never imports the downstream projection boundary. Consumers receive closed capability and read-only data-flow authority; they do not reclassify or re-derive semantic meaning.
