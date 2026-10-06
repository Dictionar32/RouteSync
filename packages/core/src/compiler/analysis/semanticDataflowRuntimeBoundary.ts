import type { DataFlowInterface } from '../../types/dataflow/dataFlowInterface';
import type { InterfaceDependencyBoundary } from '../../types/interfaces/interfaceDependencyBoundary';
import type { SemanticDataflowIdentity, SemanticDataflowInput, SemanticDataflowJudgment } from '../../types/upstream/semanticDataflow';

export type SemanticDataflowRuntimeDataFlow = DataFlowInterface<
  SemanticDataflowInput,
  SemanticDataflowJudgment,
  SemanticDataflowIdentity
>;

/**
 * Downstream-owned wiring contract from upstream semantic input to the
 * canonical generic DataFlowInterface. The generic dependency boundary owns
 * the direction: upstream is consumed by downstream wiring, never reversed.
 */
export interface SemanticDataflowRuntimeBoundary extends InterfaceDependencyBoundary<
  SemanticDataflowInput,
  SemanticDataflowRuntimeDataFlow
> {}
