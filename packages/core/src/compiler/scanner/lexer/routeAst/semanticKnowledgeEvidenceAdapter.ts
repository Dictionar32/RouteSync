/**
 * Parser/evidence boundary over the canonical semantic Knowledge/Data-Flow model.
 *
 * This contract deliberately knows nothing about PHP, Tree-sitter, AST node
 * names, tokens, or traversal. Any evidence producer may target the same
 * semantic ontology: parser, lexer, language service, reflection, framework
 * metadata, or inference.
 */
import type { SemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowRelations';

export interface SemanticKnowledgeEvidenceAdapter<TEvidence> {
  readonly produce: (evidence: TEvidence, sourceName?: string) => SemanticKnowledgeDataFlow;
}

export const semanticKnowledgeEvidenceAdapter = <TEvidence>(
  produce: SemanticKnowledgeEvidenceAdapter<TEvidence>['produce'],
): SemanticKnowledgeEvidenceAdapter<TEvidence> => Object.freeze({ produce });
