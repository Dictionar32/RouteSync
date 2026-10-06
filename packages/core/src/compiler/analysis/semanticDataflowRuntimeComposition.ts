/** Concrete downstream composition of the generic dataflow contract. */
import type { SemanticDataflowInput } from '../../types/upstream/semanticDataflow';
import type { SemanticDataflowRuntimeBoundary, SemanticDataflowRuntimeDataFlow } from './semanticDataflowRuntimeBoundary';
import { createSemanticDataflowDataFlowInterface } from './semanticDataflowDataFlowAdapter';

export const semanticDataflowRuntimeBoundary: SemanticDataflowRuntimeBoundary = Object.freeze({
  project: (input: SemanticDataflowInput): SemanticDataflowRuntimeDataFlow =>
    createSemanticDataflowDataFlowInterface(input),
});
