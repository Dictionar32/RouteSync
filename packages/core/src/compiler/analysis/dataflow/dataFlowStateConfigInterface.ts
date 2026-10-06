/**
 * Stateful analysis policy, deliberately downstream of the upstream
 * DataFlowInterface authority.
 *
 * This models the shape used by state-sensitive data-flow frameworks: source,
 * sink, barrier and additional-flow-step decisions may depend on the current
 * analysis state. It is a policy contract only; it does not execute closure.
 * The canonical semantic-dataflow authority remains responsible for its
 * least-fixed-point judgment.
 */
export interface DataFlowStateConfigInterface<Node, State> {
  readonly isSource: (node: Node, state: State) => boolean;
  readonly isSink: (node: Node, state: State) => boolean;
  readonly isAdditionalFlowStep: (
    source: Node,
    target: Node,
    sourceState: State,
    targetState: State,
  ) => boolean;
  readonly isBarrier: (node: Node, state: State) => boolean;
}

/**
 * Lift a stateless policy into the stateful policy shape without inventing
 * state semantics. This is useful while an analysis does not need state, and
 * makes the distinction explicit instead of widening DataFlowInterface.
 */
export const liftDataFlowConfigToState = <Node, State>(
  config: {
    readonly isSource: (node: Node) => boolean;
    readonly isSink: (node: Node) => boolean;
    readonly isAdditionalFlowStep: (source: Node, target: Node) => boolean;
    readonly isBarrier: (node: Node) => boolean;
  },
): DataFlowStateConfigInterface<Node, State> => Object.freeze({
  isSource: (node: Node) => config.isSource(node),
  isSink: (node: Node) => config.isSink(node),
  isAdditionalFlowStep: (source: Node, target: Node) => config.isAdditionalFlowStep(source, target),
  isBarrier: (node: Node) => config.isBarrier(node),
});
