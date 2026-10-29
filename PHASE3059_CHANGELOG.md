# Phase 3059 — Evidence Projection Outcome Propagation

## Change

- Added the language-neutral `SemanticKnowledgeEvidenceProductionOutcome` ADT to `core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts`.
- The ADT distinguishes `produced` from `blocked`; the blocked case retains the canonical knowledge model and typed validation violations.
- `SemanticKnowledgeEvidenceProjection` now carries `productionOutcome` alongside the compatibility `knowledge` field, source identity, and evidence provenance.
- The PHP semantic evidence adapter now calls `produceWithOutcome` and forwards the complete outcome instead of calling the graph-only `produce` method.
- Exported the new ADT through the upstream type barrel.
- Updated the Phase 3057 audit to recognize the outcome type's new upstream ownership.

## Runtime boundary and limitations

The outcome now crosses the PHP evidence-projection boundary as typed data. The current controller semantic authority still consumes the compatibility `knowledge` property and does not yet stop/return a blocked judgment based on `productionOutcome`. Therefore this phase does **not** claim full blocked-outcome propagation through controller analysis, CLI, or manifest.

No deleted relation foundation was restored. `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
