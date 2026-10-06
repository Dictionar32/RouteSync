import type { DataFlowProjectionInterface } from '../../types/dataflow/dataFlowProjectionInterface';
import type {
  SemanticDataflowIdentity,
  SemanticDataflowInput,
  SemanticDataflowJudgment,
} from '../../types/upstream/semanticDataflow';
import type { SemanticDataflowIRProjection } from './SemanticDataflowIRProjectionTypes';

/**
 * Public downstream projection boundary for closed semantic dataflow.
 * The contract depends on semantic input/state types, never on the concrete
 * projection implementation.
 */
export interface SemanticDataflowIRProjectionInterface extends DataFlowProjectionInterface<
  SemanticDataflowInput,
  SemanticDataflowJudgment,
  SemanticDataflowIdentity,
  SemanticDataflowIRProjection
> {}
