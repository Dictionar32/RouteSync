# Phase 3059 — Evidence Projection Outcome Propagation

## Goal

Carry producer acceptance/blocking status through the parser-neutral upstream evidence projection contract without making upstream import PHP compiler implementation details.

## Runtime path touched

`PHP AST → phpAstSemanticKnowledgeDataFlowProductionOperation.produceWithOutcome → phpAstSemanticKnowledgeEvidenceAdapter.project → SemanticKnowledgeEvidenceProjection → controller dataflow semantic judgment authority`

## Domain model

`SemanticKnowledgeEvidenceProductionOutcome` is owned by `core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts`:

- `produced` carries canonical `SemanticKnowledgeDataFlow`.
- `blocked` carries the same canonical model plus typed validation violations.

The projection retains `sourceFile` and `evidenceProvider` with `productionOutcome`, so source identity and provenance remain correlated with the producer result. A compatibility `knowledge` property remains available while consumers migrate.

## Explicit limitation

The current controller analyzer/authority still derives from `projection.knowledge`; it has not yet converted a blocked production outcome into a blocked controller judgment. This phase propagates the status, but does not claim the end-to-end continuation has been migrated. The next step is to model controller analysis as an outcome ADT and propagate `blocked` through controller body parsing and the CLI manifest boundary without discarding provenance or blocker details.

## Verification

- Phase 3059 structural audit: 12/12.
- Phase 3058 regression audit: 11/11.
- Phase 3057 regression audit: 10/10 after updating the assertion for upstream ownership of the shared outcome ADT.
- Strict TypeScript dependency closure remains blocked by pre-existing missing relation foundation imports and downstream type cascades. The removed relation modules were not restored.
- End-to-end CLI → manifest tests have not been run.
