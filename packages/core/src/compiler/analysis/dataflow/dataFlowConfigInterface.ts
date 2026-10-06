/**
 * Small configuration capabilities for semantic data-flow modeling.
 *
 * Analysis/query policy lives beside the data-flow analysis implementation.
 * This mirrors shared data-flow frameworks such as CodeQL: source/sink/step/
 * barrier describe what is flow-relevant; the DataFlowInterface authority
 * still owns execution and closure.
 */
export interface DataFlowSourcePredicateInterface<Node> {
  readonly isSource: (node: Node) => boolean;
}

export interface DataFlowSinkPredicateInterface<Node> {
  readonly isSink: (node: Node) => boolean;
}

export interface DataFlowAdditionalStepInterface<Node> {
  readonly isAdditionalFlowStep: (source: Node, target: Node) => boolean;
}

export interface DataFlowBarrierInterface<Node> {
  readonly isBarrier: (node: Node) => boolean;
}

export type DataFlowConfigInterface<Node> =
  DataFlowSourcePredicateInterface<Node>
  & DataFlowSinkPredicateInterface<Node>
  & DataFlowAdditionalStepInterface<Node>
  & DataFlowBarrierInterface<Node>;


/**
 * Constructs a query/analysis-specific configuration without coupling the
 * semantic dataflow authority to one source/sink policy.
 */
export const createDataFlowConfig = <Node>(config: DataFlowConfigInterface<Node>): DataFlowConfigInterface<Node> =>
  Object.freeze({
    isSource: config.isSource,
    isSink: config.isSink,
    isAdditionalFlowStep: config.isAdditionalFlowStep,
    isBarrier: config.isBarrier,
  });
