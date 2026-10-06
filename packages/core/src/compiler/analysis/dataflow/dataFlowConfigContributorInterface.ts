/**
 * Composable analysis-policy contribution for data-flow configuration.
 *
 * A contributor may add source/sink/additional-step/barrier policy for one
 * analysis. It does not own data-flow execution or semantic closure.
 */
export interface DataFlowConfigContribution<Node> {
  readonly isSource?: (node: Node) => boolean;
  readonly isSink?: (node: Node) => boolean;
  readonly isAdditionalFlowStep?: (source: Node, target: Node) => boolean;
  readonly isBarrier?: (node: Node) => boolean;
}

export interface DataFlowConfigContributorInterface<Node, Context> {
  readonly contribute: (context: Context) => DataFlowConfigContribution<Node>;
}

const orUnary = <Node>(predicates: readonly ((node: Node) => boolean)[]): ((node: Node) => boolean) =>
  (node: Node): boolean => predicates.some(predicate => predicate(node));

const orBinary = <Node>(predicates: readonly ((source: Node, target: Node) => boolean)[]): ((source: Node, target: Node) => boolean) =>
  (source: Node, target: Node): boolean => predicates.some(predicate => predicate(source, target));

/**
 * Composes independent analysis-policy contributors. Empty capabilities are
 * false, so every returned value is a complete DataFlowConfigInterface.
 */
export const composeDataFlowConfigContributors = <Node, Context>(
  contributors: readonly DataFlowConfigContributorInterface<Node, Context>[],
  context: Context,
) => {
  const contributions = contributors.map(contributor => contributor.contribute(context));
  return Object.freeze({
    isSource: orUnary(contributions.flatMap(contribution => contribution.isSource ? [contribution.isSource] : [])),
    isSink: orUnary(contributions.flatMap(contribution => contribution.isSink ? [contribution.isSink] : [])),
    isAdditionalFlowStep: orBinary(contributions.flatMap(contribution => contribution.isAdditionalFlowStep ? [contribution.isAdditionalFlowStep] : [])),
    isBarrier: orUnary(contributions.flatMap(contribution => contribution.isBarrier ? [contribution.isBarrier] : [])),
  });
};
