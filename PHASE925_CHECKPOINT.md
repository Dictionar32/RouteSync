# RouteSync Phase 925 Checkpoint

Phase 925 elevates structural graph-edge derivation onto the canonical upstream semantic relation graph.

Active workspace: `/mnt/data/phase925-work/phase918-work`

Key changes:
- `StructuralSemanticRelation` now includes `model_relation`.
- `sourceModelReferenceIndexFromCatalog()` emits model relation facts into `SemanticRelationGraph`.
- `projectStructuralSemanticRelationToGraphEdge()` is the single structural relation -> graph-edge projection authority.
- `manifestGraphCompiler.ts` consumes only `isStructuralSemanticRelation()` for semantic graph edge projection.
- `ControllerActionPolicyRelation` remains excluded from graph-edge projection and generic dataflow.
- Controller/resource/model/resource-model/model-relation structural edges now carry explicit graph-edge origins.
- Non-graph structural relations remain closed as `not_projectable` rather than becoming fake service edges.
- Inline Laravel e-commerce regression remains the corpus; physical `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` are absent.

Validation:
- `node scripts/audits/audit-phase924-semantic-relation-boundary.cjs` -> clean
- `node scripts/audits/audit-phase925-structural-graph-projection.cjs` -> clean
- `node scripts/audits/audit-phase917-ecommerce-fixture-boundary.cjs` -> clean
- `node --check scripts/audits/audit-phase925-structural-graph-projection.cjs` -> pass
- Vitest unavailable (`node_modules/.bin/vitest` absent)
- Targeted TypeScript checking reaches pre-existing repository-wide/frontier diagnostics; no diagnostics were emitted for `structuralSemanticRelationProjection.ts` or `semanticReferences.ts`.
