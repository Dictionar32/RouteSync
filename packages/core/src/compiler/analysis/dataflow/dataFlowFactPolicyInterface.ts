/**
 * Fact-scoped selection for analysis policy.
 *
 * Producer provenance is semantic metadata, not a source/sink decision. An
 * analysis may first select the exact facts it cares about and only then map
 * those facts to DataFlowConfig predicates.
 */
export interface DataFlowFactPolicyInterface<Fact, Context> {
  readonly select: (fact: Fact, context: Context) => boolean;
}

export const selectDataFlowFacts = <Fact, Context>(
  facts: readonly Fact[],
  policy: DataFlowFactPolicyInterface<Fact, Context>,
  context: Context,
): readonly Fact[] => Object.freeze(facts.filter(fact => policy.select(fact, context)));
