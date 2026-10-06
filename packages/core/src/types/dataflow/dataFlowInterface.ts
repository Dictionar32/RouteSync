/**
 * Small composable contracts for canonical data-flow execution.
 *
 * The semantic authority owns domain closure; `DataFlowInterface` is the
 * generic downstream execution/state/query contract exposed to consumers.
 * The aggregate `DataFlowInterface` is the sole downstream execution/state
 * contract. Domain producers provide input; downstream consumers read the
 * canonical state and query it without reclassifying the semantic wrapper.
 */
export interface DataFlowSourceInterface<Input, Seed> {
  readonly seed: (input: Input) => Seed;
}

export interface DataFlowStepInterface<State> {
  readonly derive: (state: State) => State;
}

export interface DataFlowFixpointInterface<State> {
  readonly close: (state: State) => State;
}

export interface DataFlowStateInterface<State> {
  /** Canonical current state; downstream consumers must read state through the data-flow contract. */
  readonly state: State;
}

export interface DataFlowQueryInterface<State, Node> {
  readonly reaches: (state: State, source: Node, target: Node) => boolean;
}

/**
 * Canonical generic data-flow contract assembled from small capabilities.
 * Domain-specific source/sink/barrier policy belongs to analysis configuration;
 * this contract only exposes execution, state, fixed-point closure, and query.
 */
export type DataFlowInterface<Input, State, Node> =
  DataFlowSourceInterface<Input, State>
  & DataFlowStateInterface<State>
  & DataFlowStepInterface<State>
  & DataFlowFixpointInterface<State>
  & DataFlowQueryInterface<State, Node>;

