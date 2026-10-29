/**
 * Production composition root for the scanner data-flow analyzer.
 * Concrete upstream runtime selection is isolated here; the analyzer itself
 * depends only on SemanticDataflowRuntimeExecutorInterface.
 */
import { semanticDataflowRuntimeExecutor } from '../../../types/upstream/semanticDataflowRuntimeExecutor';
import { createSemanticDataFlowAnalyzer } from '../../frontend/php/routeAst/semanticDataFlowAnalyzer';

export const semanticDataFlowAnalyzer = createSemanticDataFlowAnalyzer(semanticDataflowRuntimeExecutor);
export const analyzeSemanticDataFlowJudgment = semanticDataFlowAnalyzer.analyzeSemanticDataFlowJudgment;
export const analyzeSemanticDataFlow = semanticDataFlowAnalyzer.analyzeSemanticDataFlow;
