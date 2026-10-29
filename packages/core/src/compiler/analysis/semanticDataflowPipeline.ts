/** Runtime execution boundary for an already-closed upstream dataflow judgment. */
import type { DataFlowAuthorityInterface } from '../../types/dataflow/dataFlowInterface';
import type { SemanticDataflowIdentity, SemanticDataflowJudgment } from '../../types/upstream/semanticDataflow';
import type { SemanticDataflowRuntimeBoundary } from './semanticDataflowRuntimeBoundary';

export interface SemanticDataflowAnalysisResult {
  readonly kind: 'semantic_dataflow_analysis_result';
  readonly input: SemanticDataflowJudgment;
  readonly interface: DataFlowAuthorityInterface<SemanticDataflowJudgment, SemanticDataflowJudgment, SemanticDataflowIdentity>;
  readonly closed: true;
}

/** Named runtime contract for projecting an already-closed upstream judgment. */
export interface ClosedSemanticDataflowJudgmentProjectionInterface {
  readonly project: (
    input: SemanticDataflowJudgment,
    runtime: SemanticDataflowRuntimeBoundary,
  ) => SemanticDataflowAnalysisResult;
}

/**
 * Projects the upstream-closed judgment into a read-only runtime interface.
 * This operation cannot close an input or invoke semantic authority.
 */
export const closedSemanticDataflowJudgmentProjection: ClosedSemanticDataflowJudgmentProjectionInterface = Object.freeze({
  project: (
    input: SemanticDataflowJudgment,
    runtime: SemanticDataflowRuntimeBoundary,
  ): SemanticDataflowAnalysisResult => {
    const dataflow = runtime.project(input);
    return Object.freeze({
      kind: 'semantic_dataflow_analysis_result',
      input,
      interface: dataflow,
      closed: true,
    });
  },
});
