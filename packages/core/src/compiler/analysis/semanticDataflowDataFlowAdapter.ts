/**
 * Downstream wiring adapter from the canonical upstream semantic-dataflow
 * judgment to the generic DataFlowInterface.
 *
 * The upstream authority owns semantic closure. This adapter does not derive
 * new domain facts; it only exposes that closed judgment through the generic
 * execution/state/query contract consumed by analysis, IR, and CLI.
 */
import type { DataFlowInterface } from '../../types/dataflow/dataFlowInterface';
import type {
  SemanticDataflowFact,
  SemanticDataflowIdentity,
  SemanticDataflowInput,
  SemanticDataflowJudgment,
} from '../../types/upstream/semanticDataflow';
import { createSemanticDataflowJudgment } from '../../types/upstream/semanticDataflowAuthority';
import { semanticDataflowIdentityEqual } from '../../types/upstream/semanticDataflow';
import { semanticReasoningContract } from '../../types/upstream/semanticReasoning';

export type SemanticDataflowDataFlowInterface = DataFlowInterface<
  SemanticDataflowInput,
  SemanticDataflowJudgment,
  SemanticDataflowIdentity
>;

export const createSemanticDataflowDataFlowInterface = (
  input: SemanticDataflowInput,
): SemanticDataflowDataFlowInterface => {
  const state = createSemanticDataflowJudgment(input);

  return Object.freeze({
    kind: 'data_flow_interface',
    authority: 'upstream',
    reasoning: semanticReasoningContract('declarative_relation_rewrite_fixed_point'),
    closed: true,
    input,
    seed: (nextInput: SemanticDataflowInput) => createSemanticDataflowJudgment(nextInput),
    state,
    // The upstream judgment is already closed. Downstream execution must not
    // re-run semantic closure; derive/close therefore preserve the canonical state.
    derive: (current: SemanticDataflowJudgment) => current,
    close: (current: SemanticDataflowJudgment) => current,
    judge: (current: SemanticDataflowJudgment) => current,
    reaches: (
      current: SemanticDataflowJudgment,
      source: SemanticDataflowIdentity,
      target: SemanticDataflowIdentity,
    ) => current.closure.some(fact =>
      fact.kind === 'reaches' &&
      semanticDataflowIdentityEqual(fact.source, source) &&
      semanticDataflowIdentityEqual(fact.target, target),
    ),
  });
};
