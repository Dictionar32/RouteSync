import type { PhpBlock } from '../phpAstTypes';
import { producePhpAstSemanticKnowledgeDataFlow } from './phpAstSemanticKnowledgeDataFlowAdapter';
import type { SemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowRelations';
import type { SemanticEvidenceProvider } from '../../../../types/upstream/semanticDataflowKnowledge';
import { createSourceFile } from '../../../../types/upstream/names';
import type { SemanticKnowledgeEvidenceProjectionInput } from '../../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface';
import type { SemanticKnowledgeEvidenceAdapter } from '../../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface';

/**
 * Parser-independent semantic adapter contract.
 *
 * The contract is exported from a parser-neutral module; this file only
 * binds the PHP evidence implementation to that contract.
 */
export type { SemanticKnowledgeEvidenceAdapter } from '../../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface';

export const phpAstSemanticKnowledgeEvidenceAdapter: SemanticKnowledgeEvidenceAdapter<PhpBlock> = Object.freeze({
  project: (input: SemanticKnowledgeEvidenceProjectionInput<PhpBlock>) => {
    const evidenceProvider: SemanticEvidenceProvider = Object.freeze({ code: 'parser' });
    return Object.freeze({
      kind: 'semantic_knowledge_evidence_projection',
      sourceFile: input.sourceFile,
      evidenceProvider,
      knowledge: producePhpAstSemanticKnowledgeDataFlow(
        input.evidence,
        input.sourceFile.value.value,
        evidenceProvider.code,
      ),
    });
  },
});

/**
 * Current PHP adapter entry point. The function name is retained as API
 * compatibility; its implementation is deliberately isolated behind the
 * evidence-adapter boundary above.
 */
export function produceSemanticKnowledgeDataFlow(block: PhpBlock, filePath = '<php-source>'): SemanticKnowledgeDataFlow {
  return phpAstSemanticKnowledgeEvidenceAdapter.project({
    kind: 'semantic_knowledge_evidence_projection_input',
    evidence: block,
    sourceFile: createSourceFile(filePath),
  }).knowledge;
}
