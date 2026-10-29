import type { SemanticKnowledgeDataFlow, SemanticEvidenceProvider } from './semanticDataflowKnowledge';
import type { SemanticKnowledgeDataFlowValidationViolation } from './semanticDataflowKnowledgeValidation';
import type { SourceFile } from './names';

/**
 * A source-correlated request to project syntax/framework evidence into the
 * canonical semantic Knowledge/Data-Flow model. Source identity is bound by
 * the caller; source-specific provenance is owned by the concrete projector.
 */
export interface SemanticKnowledgeEvidenceProjectionInput<TEvidence> {
  readonly kind: 'semantic_knowledge_evidence_projection_input';
  readonly evidence: TEvidence;
  readonly sourceFile: SourceFile;
}

/** Producer outcome shared across source-language adapters without importing parser code upstream. */
export type SemanticKnowledgeEvidenceProductionOutcome =
  | { readonly kind: 'produced'; readonly knowledge: SemanticKnowledgeDataFlow }
  | {
      readonly kind: 'blocked';
      readonly knowledge: SemanticKnowledgeDataFlow;
      readonly violations: readonly SemanticKnowledgeDataFlowValidationViolation[];
    };

/**
 * Result of evidence projection. The canonical graph, its source provenance,
 * and the producer's accepted/blocked outcome remain one typed value.
 */
export interface SemanticKnowledgeEvidenceProjection {
  readonly kind: 'semantic_knowledge_evidence_projection';
  readonly sourceFile: SourceFile;
  readonly evidenceProvider: SemanticEvidenceProvider;
  readonly knowledge: SemanticKnowledgeDataFlow;
  /** Source producer's accepted/blocked outcome is preserved across the adapter boundary. */
  readonly productionOutcome: SemanticKnowledgeEvidenceProductionOutcome;
}

/**
 * Upstream-owned source-evidence projection contract. Concrete syntax remains
 * projector-owned; consumers receive canonical semantic knowledge paired with
 * its source identity and evidence-provider provenance.
 */
export interface SemanticKnowledgeEvidenceAdapter<TEvidence> {
  readonly project: (
    input: SemanticKnowledgeEvidenceProjectionInput<TEvidence>,
  ) => SemanticKnowledgeEvidenceProjection;
}
