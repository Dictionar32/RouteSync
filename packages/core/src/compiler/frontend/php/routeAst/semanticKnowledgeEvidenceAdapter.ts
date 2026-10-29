/**
 * Compatibility type barrel for older route-AST imports.
 * The projector implementation is defined directly in semanticKnowledgeDataFlowProducer.ts;
 * this module intentionally contains no factory or runtime semantic layer.
 */
export type {
  SemanticKnowledgeEvidenceAdapter,
  SemanticKnowledgeEvidenceProjection,
  SemanticKnowledgeEvidenceProjectionInput,
} from '../../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface';
