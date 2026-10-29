# Phase 359 — Knowledge Data-Flow Relational Cutover

`semanticKnowledgeDataFlowModel.ts` is now an empty legacy boundary.

Canonical authority:

`semanticKnowledgeDataFlowRelations.ts`

The knowledge/data-flow vocabulary remains semantic data. Optionality is represented by
`SemanticPresence`; validation and derived relations use relation predicates and relation
resolution. PHP `null` remains a tagged semantic literal and is not an absence sentinel.

The legacy model file must remain empty and must not regain semantic authority.
