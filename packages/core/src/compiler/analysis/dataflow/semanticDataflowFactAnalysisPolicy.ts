/**
 * Runtime query policy over a pre-materialized upstream query-policy contract.
 * This layer does not classify facts by producer and does not alter semantic
 * closure; it executes the source/sink selection already carried by the contract.
 */
import type { DataFlowAuthorityInterface } from '../../../types/dataflow/dataFlowInterface';
import type {
  SemanticDataflowFact,
  SemanticDataflowIdentity,
  SemanticDataflowJudgment,
} from '../../../types/upstream/semanticDataflow';
import { semanticDataflowIdentityEqual } from '../../../types/upstream/semanticDataflow';
import { decodeSemanticDataflowQueryPolicyContract, semanticDataflowFactContractKey, type SemanticDataflowQueryPolicyContract } from '../../../types/upstream/semanticDataflowQueryPolicy';
import type { DataFlowConfigInterface } from './dataFlowConfigInterface';
import type { DataFlowFactPolicyInterface } from './dataFlowFactPolicyInterface';
import { composeDataFlowConfigContributors, type DataFlowConfigContributorInterface } from './dataFlowConfigContributorInterface';

export interface SemanticDataflowAnalysisPolicy {
  readonly contract: SemanticDataflowQueryPolicyContract;
  readonly factPolicy: DataFlowFactPolicyInterface<SemanticDataflowFact, SemanticDataflowQueryPolicyContract>;
  readonly config: DataFlowConfigInterface<SemanticDataflowIdentity>;
  readonly selectedFacts: readonly SemanticDataflowFact[];
  readonly sourceFacts: readonly SemanticDataflowFact[];
  readonly sinkFacts: readonly SemanticDataflowFact[];
}

const factContains = (
  facts: readonly SemanticDataflowFact[],
  identity: SemanticDataflowIdentity,
): boolean => facts.some(fact => {
  if (fact.kind === 'reaches' || fact.lineage === undefined) return false;
  return semanticDataflowIdentityEqual(fact.lineage.identity, identity);
});

/** Execute an upstream-materialized policy; never infer producer domains here. */
export const createSemanticDataflowAnalysisPolicy = (
  dataflow: DataFlowAuthorityInterface<SemanticDataflowJudgment, SemanticDataflowJudgment, SemanticDataflowIdentity>,
  candidate: unknown,
): SemanticDataflowAnalysisPolicy => {
  const validatedContract = decodeSemanticDataflowQueryPolicyContract(candidate, dataflow.state);
  if (validatedContract === undefined) {
    throw new Error('Semantic dataflow query-policy contract is invalid for the closed runtime judgment');
  }
  const factPolicy: DataFlowFactPolicyInterface<SemanticDataflowFact, SemanticDataflowQueryPolicyContract> = Object.freeze({
    select: (fact: SemanticDataflowFact, policyContract: SemanticDataflowQueryPolicyContract) =>
      policyContract.selectedFacts.some(selected => semanticDataflowFactContractKey(selected) === semanticDataflowFactContractKey(fact)),
  });
  const selectedFacts = validatedContract.selectedFacts;
  const contributor: DataFlowConfigContributorInterface<SemanticDataflowIdentity, {
    readonly sourceFacts: readonly SemanticDataflowFact[];
    readonly sinkFacts: readonly SemanticDataflowFact[];
  }> = Object.freeze({
    contribute: (contributionContext: {
      readonly sourceFacts: readonly SemanticDataflowFact[];
      readonly sinkFacts: readonly SemanticDataflowFact[];
    }) => Object.freeze({
      isSource: (node: SemanticDataflowIdentity) => factContains(contributionContext.sourceFacts, node),
      isSink: (node: SemanticDataflowIdentity) => factContains(contributionContext.sinkFacts, node),
      isAdditionalFlowStep: (source: SemanticDataflowIdentity, target: SemanticDataflowIdentity) =>
        validatedContract.additionalFlowSteps.some(step => semanticDataflowIdentityEqual(step.source, source) && semanticDataflowIdentityEqual(step.target, target)),
      isBarrier: (node: SemanticDataflowIdentity) =>
        validatedContract.barrierNodes.some(barrier => semanticDataflowIdentityEqual(barrier, node)),
    }),
  });
  const config = composeDataFlowConfigContributors([contributor], {
    sourceFacts: validatedContract.sourceFacts,
    sinkFacts: validatedContract.sinkFacts,
  });

  // The closed state is validated above; this policy cannot mutate or rebuild it.
  return Object.freeze({
    contract: validatedContract,
    factPolicy,
    selectedFacts,
    sourceFacts: validatedContract.sourceFacts,
    sinkFacts: validatedContract.sinkFacts,
    config,
  });
};

/** Query the canonical closed result under an already-materialized policy. */
export const semanticDataflowFlowsUnderPolicy = (
  dataflow: DataFlowAuthorityInterface<SemanticDataflowJudgment, SemanticDataflowJudgment, SemanticDataflowIdentity>,
  policy: SemanticDataflowAnalysisPolicy,
  source: SemanticDataflowIdentity,
  target: SemanticDataflowIdentity,
): boolean => policy.config.isSource(source)
  && policy.config.isSink(target)
  && dataflow.reaches(dataflow.state, source, target);
