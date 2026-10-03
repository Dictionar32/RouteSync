import type { PhpBlock } from '../phpAstTypes';
import { producePhpAstSemanticKnowledgeDataFlow } from './phpAstSemanticKnowledgeDataFlowAdapter';
import type { SemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowRelations';
import { semanticKnowledgeEvidenceAdapter, type SemanticKnowledgeEvidenceAdapter } from './semanticKnowledgeEvidenceAdapter';

/**
 * Parser-independent semantic adapter contract.
 *
 * The contract is exported from a parser-neutral module; this file only
 * binds the PHP evidence implementation to that contract.
 */
export type { SemanticKnowledgeEvidenceAdapter } from './semanticKnowledgeEvidenceAdapter';

export const phpAstSemanticKnowledgeEvidenceAdapter: SemanticKnowledgeEvidenceAdapter<PhpBlock> =
  semanticKnowledgeEvidenceAdapter(producePhpAstSemanticKnowledgeDataFlow);

/**
 * Current PHP adapter entry point. The function name is retained as API
 * compatibility; its implementation is deliberately isolated behind the
 * evidence-adapter boundary above.
 */
export function produceSemanticKnowledgeDataFlow(block: PhpBlock, filePath = '<php-source>'): SemanticKnowledgeDataFlow {
  return phpAstSemanticKnowledgeEvidenceAdapter.produce(block, filePath);
}
