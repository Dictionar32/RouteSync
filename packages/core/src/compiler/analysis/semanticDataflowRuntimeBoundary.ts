import type { DataFlowAuthorityInterface } from '../../types/dataflow/dataFlowInterface';
import type { UpstreamWiringInterface } from '../../types/interfaces/interfaceDependencyBoundary';
import type { SemanticDataflowIdentity, SemanticDataflowJudgment } from '../../types/upstream/semanticDataflow';

/** Read-only execution surface built from an upstream-closed judgment. */
export type SemanticDataflowRuntimeDataFlow = DataFlowAuthorityInterface<
  SemanticDataflowJudgment,
  SemanticDataflowJudgment,
  SemanticDataflowIdentity
>;

/**
 * Runtime wiring accepts only a closed judgment. Raw semantic inputs cannot
 * cross this boundary, so runtime cannot invoke or reconstruct semantic reasoning.
 */
export interface SemanticDataflowRuntimeBoundary extends UpstreamWiringInterface<
  SemanticDataflowJudgment,
  SemanticDataflowRuntimeDataFlow
> {}
