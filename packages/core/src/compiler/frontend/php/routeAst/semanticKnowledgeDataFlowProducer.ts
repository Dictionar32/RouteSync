import type { PhpBlock } from '../phpAstTypes';
import { phpAstSemanticKnowledgeDataFlowProductionOperation, type PhpAstSemanticKnowledgeDataFlowProductionInput, type PhpAstSemanticKnowledgeDataFlowProductionOutcome } from './phpAstSemanticKnowledgeDataFlowAdapter';
import type { SemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowRelations';
import type { SemanticEvidenceProvider } from '../../../../types/upstream/semanticDataflowKnowledge';
import { sourceFileIdentityFactory, stringValue } from '../../../../types/upstream/names';
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
    const productionOutcome = phpAstSemanticKnowledgeDataFlowProductionOperation.produceWithOutcome({
      block: input.evidence,
      sourceFile: input.sourceFile,
      evidenceProvider,
    });
    return Object.freeze({
      kind: 'semantic_knowledge_evidence_projection',
      sourceFile: input.sourceFile,
      evidenceProvider,
      knowledge: productionOutcome.knowledge,
      productionOutcome,
    });
  },
});

/**
 * Typed runtime producer contract. Runtime callers must supply source identity
 * and evidence provenance as domain values; no positional path or optional
 * provenance arguments are accepted here.
 */
export interface SemanticKnowledgeDataFlowProducerInterface {
  readonly produceWithOutcome: (input: PhpAstSemanticKnowledgeDataFlowProductionInput) => PhpAstSemanticKnowledgeDataFlowProductionOutcome;
}

export const semanticKnowledgeDataFlowProducer: SemanticKnowledgeDataFlowProducerInterface = Object.freeze({
  produceWithOutcome: (input: PhpAstSemanticKnowledgeDataFlowProductionInput): PhpAstSemanticKnowledgeDataFlowProductionOutcome =>
    phpAstSemanticKnowledgeDataFlowProductionOperation.produceWithOutcome(input),
});

/**
 * Explicitly isolated compatibility boundary for older parser tests/callers.
 * New runtime composition must use semanticKnowledgeDataFlowProducer and a
 * complete PhpAstSemanticKnowledgeDataFlowProductionInput.
 */
export interface LegacySemanticKnowledgeDataFlowProducerInterface {
  readonly produce: (block: PhpBlock, filePath?: string) => SemanticKnowledgeDataFlow;
}

export const legacySemanticKnowledgeDataFlowProducer: LegacySemanticKnowledgeDataFlowProducerInterface = Object.freeze({
  produce: (block: PhpBlock, filePath = '<php-source>'): SemanticKnowledgeDataFlow =>
    phpAstSemanticKnowledgeEvidenceAdapter.project({
      kind: 'semantic_knowledge_evidence_projection_input',
      evidence: block,
      sourceFile: sourceFileIdentityFactory.create(stringValue.create(filePath)),
    }).knowledge,
});
