import type { SemanticKnowledgeDataFlow, SemanticEvidenceProvider } from './semanticDataflowKnowledge';
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

/**
 * Result of evidence projection. The canonical graph and the provenance that
 * governed its construction remain one typed value for downstream composition.
 */
export interface SemanticKnowledgeEvidenceProjection {
  readonly kind: 'semantic_knowledge_evidence_projection';
  readonly sourceFile: SourceFile;
  readonly evidenceProvider: SemanticEvidenceProvider;
  readonly knowledge: SemanticKnowledgeDataFlow;
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
