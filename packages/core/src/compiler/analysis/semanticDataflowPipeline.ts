/** Production analysis boundary for canonical scanner dataflow input. */
import type { DataFlowInterface } from '../../types/dataflow/dataFlowInterface';
import type { SemanticDataflowInput, SemanticDataflowIdentity, SemanticDataflowJudgment } from '../../types/upstream/semanticDataflow';
import type { SemanticDataflowRuntimeBoundary } from './semanticDataflowRuntimeBoundary';

export interface SemanticDataflowAnalysisResult {
  readonly kind: 'semantic_dataflow_analysis_result';
  readonly input: SemanticDataflowInput;
  readonly interface: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>;
  readonly closed: true;
}

/**
 * Consumes canonical scanner output and closes it through the analysis authority.
 * Scanner never imports this module; ownership therefore remains downstream.
 */
export const analyzeSemanticDataflowInput = (
  input: SemanticDataflowInput,
  runtime: SemanticDataflowRuntimeBoundary,
): SemanticDataflowAnalysisResult => {
  const dataflow = runtime.project(input);
  return Object.freeze({
    kind: 'semantic_dataflow_analysis_result',
    input,
    interface: dataflow,
    closed: true,
  });
};
