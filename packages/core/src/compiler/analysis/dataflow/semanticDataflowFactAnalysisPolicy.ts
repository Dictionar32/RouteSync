/**
 * Analysis/query policy over the canonical semantic dataflow judgment.
 *
 * This layer selects seed facts by their fact-scoped lineage and derives
 * source/sink predicates from those selected facts. It never creates or
 * changes semantic closure; SemanticDataflowAuthority remains the sole
 * fixed-point authority.
 */
import type { DataFlowInterface } from '../../../types/dataflow/dataFlowInterface';
import type {
  SemanticDataflowFact,
  SemanticDataflowIdentity,
  SemanticDataflowInput,
  SemanticDataflowJudgment,
} from '../../../types/upstream/semanticDataflow';
import { semanticDataflowIdentityEqual } from '../../../types/upstream/semanticDataflow';
import type { DataFlowConfigInterface } from './dataFlowConfigInterface';
import type { DataFlowFactPolicyInterface } from './dataFlowFactPolicyInterface';
import { selectDataFlowFacts } from './dataFlowFactPolicyInterface';
import { composeDataFlowConfigContributors, type DataFlowConfigContributorInterface } from './dataFlowConfigContributorInterface';

export type SemanticDataflowFactProducer = NonNullable<
  Exclude<SemanticDataflowFact, { readonly kind: 'reaches' }>['lineage']
>['producer'];

export interface SemanticDataflowFactPolicyContext {
  readonly sourceProducers: readonly SemanticDataflowFactProducer[];
  readonly sinkProducers: readonly SemanticDataflowFactProducer[];
}

export interface SemanticDataflowAnalysisPolicy {
  readonly factPolicy: DataFlowFactPolicyInterface<SemanticDataflowFact, SemanticDataflowFactPolicyContext>;
  readonly config: DataFlowConfigInterface<SemanticDataflowIdentity>;
  readonly selectedFacts: readonly SemanticDataflowFact[];
  readonly sourceFacts: readonly SemanticDataflowFact[];
  readonly sinkFacts: readonly SemanticDataflowFact[];
}

const hasProducer = (
  fact: SemanticDataflowFact,
  producers: readonly SemanticDataflowFactProducer[],
): boolean => fact.kind !== 'reaches'
  && fact.lineage !== undefined
  && producers.some(producer => producer === fact.lineage?.producer);

const factContains = (
  facts: readonly SemanticDataflowFact[],
  identity: SemanticDataflowIdentity,
): boolean => facts.some(fact => {
  if (fact.kind === 'reaches' || fact.lineage === undefined) return false;
  return semanticDataflowIdentityEqual(fact.lineage.identity, identity);
});

/**
 * Build a query policy for one explicit set of producer domains.
 *
 * `source`/`sink` are intentionally derived from separately selected seed
 * facts. A caller must explicitly choose source and sink producer sets; this
 * API does not assert that route/resource/controller/etc. are inherently
 * sources or sinks.
 */
export const createSemanticDataflowAnalysisPolicy = (
  dataflow: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>,
  context: SemanticDataflowFactPolicyContext,
): SemanticDataflowAnalysisPolicy => {
  const factPolicy: DataFlowFactPolicyInterface<SemanticDataflowFact, SemanticDataflowFactPolicyContext> = Object.freeze({
    select: (fact: SemanticDataflowFact, policyContext: SemanticDataflowFactPolicyContext) =>
      hasProducer(fact, policyContext.sourceProducers)
      || hasProducer(fact, policyContext.sinkProducers),
  });
  const selectedFacts = selectDataFlowFacts(dataflow.state.facts, factPolicy, context);
  const sourceFacts = Object.freeze(selectedFacts.filter(fact => hasProducer(fact, context.sourceProducers)));
  const sinkFacts = Object.freeze(selectedFacts.filter(fact => hasProducer(fact, context.sinkProducers)));
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
      isAdditionalFlowStep: (_source: SemanticDataflowIdentity, _target: SemanticDataflowIdentity) => false,
      isBarrier: (_node: SemanticDataflowIdentity) => false,
    }),
  });
  const config = composeDataFlowConfigContributors([contributor], { sourceFacts, sinkFacts });

  return Object.freeze({ factPolicy, selectedFacts, sourceFacts, sinkFacts, config });
};

/** Query the canonical closed result using the same explicit policy scope. */
export const semanticDataflowFlowsUnderPolicy = (
  dataflow: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>,
  policy: SemanticDataflowAnalysisPolicy,
  source: SemanticDataflowIdentity,
  target: SemanticDataflowIdentity,
): boolean => policy.config.isSource(source)
  && policy.config.isSink(target)
  && dataflow.reaches(dataflow.state, source, target);
