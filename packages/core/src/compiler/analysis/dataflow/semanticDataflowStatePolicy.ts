/**
 * Stateful query policy over an already-closed semantic data-flow judgment.
 *
 * This is deliberately a query-time policy view, not a second solver. The
 * canonical DataFlowInterface remains the only owner of derive/close
 * and reaches(). State can refine source/sink decisions, while additional
 * steps and barriers are descriptive policy capabilities until a future
 * stateful solver explicitly consumes them.
 */
import type { DataFlowInterface } from '../../../types/dataflow/dataFlowInterface';
import type { SemanticDataflowIdentity, SemanticDataflowInput, SemanticDataflowJudgment } from '../../../types/upstream/semanticDataflow';
import type { DataFlowStateConfigInterface } from './dataFlowStateConfigInterface';

export interface SemanticDataflowStatePolicy<State> {
  readonly stateConfig: DataFlowStateConfigInterface<SemanticDataflowIdentity, State>;
  readonly flows: (
    source: SemanticDataflowIdentity,
    target: SemanticDataflowIdentity,
    sourceState: State,
    targetState: State,
  ) => boolean;
}

/**
 * Bind state-sensitive source/sink selection to the canonical closed result.
 *
 * The state is consulted only for policy classification. No stateful closure
 * is recomputed here, so this function cannot create a second data-flow
 * authority. `isAdditionalFlowStep` and `isBarrier` remain available to a
 * future state-aware solver but are intentionally not interpreted here.
 */
export const createSemanticDataflowStatePolicy = <State>(
  dataflow: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>,
  stateConfig: DataFlowStateConfigInterface<SemanticDataflowIdentity, State>,
): SemanticDataflowStatePolicy<State> => Object.freeze({
  stateConfig,
  flows: (source, target, sourceState, targetState) =>
    stateConfig.isSource(source, sourceState)
    && stateConfig.isSink(target, targetState)
    && dataflow.reaches(dataflow.state, source, target),
});


/**
 * Canonical request-flow states used by the ecommerce/FormRequest boundary.
 * These are policy labels only; request projection facts remain the evidence
 * and the canonical dataflow judgment remains the sole closure authority.
 */
export type SemanticDataflowRequestState =
  | 'raw_request'
  | 'validated_request'
  | 'controller_request';

export const createSemanticDataflowRequestStateConfig = (): DataFlowStateConfigInterface<
  SemanticDataflowIdentity,
  SemanticDataflowRequestState
> => Object.freeze({
  isSource: (node: SemanticDataflowIdentity, state: SemanticDataflowRequestState) => state === 'raw_request' && node.slot.value.includes(':raw:'),
  isSink: (node: SemanticDataflowIdentity, state: SemanticDataflowRequestState) => state === 'controller_request' && node.slot.value.includes(':field:'),
  isAdditionalFlowStep: () => false,
  isBarrier: () => false,
});
