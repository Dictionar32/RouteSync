# Phase 1126 — Identity / Provenance Conservation

Direction: `upstream => wiring => interface => downstream`.

Canonical model-relation identity remains `ModelSemanticRelationIdentity` and is keyed by `modelSemanticRelationIdentityKey`. Schema foreign-key evidence remains `SchemaForeignKeyEvidence` with migration provenance. `ModelSemanticRelation.provenance` carries that schema evidence into the canonical relation.

The source-model relation graph carries `SemanticRelation(kind=model_relation)` once. The graph projection preserves the full `ModelSemanticRelation` and its optional schema lineage in `GraphSemanticRelation.provenance`; `GraphEdgeRelation` is only a downstream alias/projection. `GraphEdgeRelationSink` deduplicates using the canonical model-relation identity key and retains the original projected relation.

No model-relation or schema semantics are recomputed in graph/IR/dataflow consumers. Runtime `DataFlowInterface` producer vocabulary remains limited to `request | route | controller | resource`; model-relation/schema are structural/provenance evidence, not automatically runtime dataflow producers.
