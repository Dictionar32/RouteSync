/**
 * Pure downstream projection from an upstream-closed judgment to the read-only
 * DataFlowAuthorityInterface. This adapter performs no reasoning and has no
 * authority dependency; it preserves the exact judgment and proof by identity.
 */
import type { DataFlowAuthorityInterface } from '../../types/dataflow/dataFlowInterface';
import type { SemanticDataflowIdentity, SemanticDataflowJudgment } from '../../types/upstream/semanticDataflow';
import { semanticDataflowIdentityOperations } from '../../types/upstream/semanticDataflow';

export type SemanticDataflowDataFlowInterface = DataFlowAuthorityInterface<
  SemanticDataflowJudgment,
  SemanticDataflowJudgment,
  SemanticDataflowIdentity
>;

export const createSemanticDataflowDataFlowInterface = (
  judgment: SemanticDataflowJudgment,
): SemanticDataflowDataFlowInterface => Object.freeze({
  kind: 'data_flow_interface',
  authority: 'upstream',
  reasoning: judgment.reasoningContract,
  closed: true,
  input: judgment,
  state: judgment,
  reaches: (
    current: SemanticDataflowJudgment,
    source: SemanticDataflowIdentity,
    target: SemanticDataflowIdentity,
  ) => current.closure.some(fact =>
    fact.kind === 'reaches' &&
    semanticDataflowIdentityOperations.equal(fact.source, source) &&
    semanticDataflowIdentityOperations.equal(fact.target, target),
  ),
});
