/** Concrete wiring composition: execute the contract projection, not semantic reasoning. */
import type { SemanticDataflowJudgment } from '../../types/upstream/semanticDataflow';
import type { SemanticDataflowRuntimeBoundary, SemanticDataflowRuntimeDataFlow } from './semanticDataflowRuntimeBoundary';
import { createSemanticDataflowDataFlowInterface } from './semanticDataflowDataFlowAdapter';

export const semanticDataflowRuntimeBoundary: SemanticDataflowRuntimeBoundary = Object.freeze({
  project: (judgment: SemanticDataflowJudgment): SemanticDataflowRuntimeDataFlow =>
    createSemanticDataflowDataFlowInterface(judgment),
});
