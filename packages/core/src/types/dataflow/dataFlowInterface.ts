/**
 * Small composable contracts for canonical data-flow execution.
 *
 * Semantic authority remains upstream. The generic execution contract is
 * domain-neutral; the read-only authority bridge makes ownership explicit for
 * downstream consumers that must not reconstruct semantic meaning.
 */
import type { SemanticCapabilityAuthorityInterface, SemanticCapabilityContractInterface } from '../upstream/semanticCapability';
import type { UpstreamWiringInterface } from '../interfaces/interfaceDependencyBoundary';
import type { SemanticReasoningAuthorityInterface, SemanticReasoningContract, SemanticReasoningEvidence, SemanticReasoningExecutionInterface, SemanticReasoningStrategy } from '../upstream/semanticReasoning';

export type DataFlowInterfaceKind = 'data_flow_interface';

export interface DataFlowSourceInterface<Input, Seed> {
  readonly seed: (input: Input) => Seed;
}

export interface DataFlowStepInterface<State> {
  readonly derive: (state: State) => State;
}

export interface DataFlowFixpointInterface<State> {
  readonly close: (state: State) => State;
}

export interface DataFlowInputInterface<Input> {
  readonly input: Input;
}

export interface DataFlowStateInterface<State> {
  readonly state: State;
}

export interface DataFlowQueryInterface<State, Node> {
  readonly reaches: (state: State, source: Node, target: Node) => boolean;
}

/** Closed ownership marker for a canonical semantic data-flow authority. */
export interface DataFlowClosureInterface {
  readonly closed: true;
}

/** Explicit execution algebra: production is separate from read-only authority. */
export interface DataFlowExecutionAlgebraInterface<Input, State>
  extends SemanticReasoningExecutionInterface<Input, State>,
    DataFlowSourceInterface<Input, State>,
    DataFlowStepInterface<State>,
    DataFlowFixpointInterface<State> {}

/** Explicit authority algebra: downstream sees input/state/query/closure only. */
export interface DataFlowAuthorityAlgebraInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
>
  extends DataFlowInputInterface<Input>,
    DataFlowStateInterface<State>,
    DataFlowQueryInterface<State, Node>,
    DataFlowClosureInterface,
    SemanticReasoningAuthorityInterface<Reasoning['strategy'], ReasoningEvidence, Reasoning> {}

export interface DataFlowExecutionInterface<Input, State>
  extends DataFlowExecutionAlgebraInterface<Input, State> {}

/** Producer-only contract: execution remains upstream-owned. */
export interface DataFlowProducerContractInterface<Input, State>
  extends DataFlowExecutionInterface<Input, State> {}

/** Producer-only interface: never expose this surface to downstream consumers. */
export interface DataFlowProducerInterface<Input, State>
  extends DataFlowProducerContractInterface<Input, State> {}

export interface DataFlowAuthorityContractInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends DataFlowAuthorityAlgebraInterface<Input, State, Node, ReasoningEvidence, Reasoning> {}

export interface DataFlowAuthorityInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
>
  extends DataFlowAuthorityContractInterface<Input, State, Node, ReasoningEvidence, Reasoning> {
  readonly kind: DataFlowInterfaceKind;
  readonly authority: 'upstream';
}

/**
 * Contract algebra: execution and read-only authority are composed before the
 * public DataFlowInterface name is introduced. This mirrors the upstream
 * semantic-reasoning contract shape while keeping semantic ownership outside
 * the generic data-flow execution surface.
 */
export interface DataFlowContractInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends
  DataFlowProducerInterface<Input, State>,
  DataFlowAuthorityInterface<Input, State, Node, ReasoningEvidence, Reasoning> {}

export interface DataFlowCapabilityAuthorityInterface<
  Input,
  State,
  Node,
  Capability extends SemanticCapabilityContractInterface = SemanticCapabilityContractInterface,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends DataFlowAuthorityInterface<Input, State, Node, ReasoningEvidence, Reasoning>,
    SemanticCapabilityAuthorityInterface<Capability> {}

/** Closed consumer surface: authority only, never execution/reclassification. */
export interface DataFlowConsumerAlgebraInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends DataFlowAuthorityContractInterface<Input, State, Node, ReasoningEvidence, Reasoning> {}

export interface DataFlowConsumerContractInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends DataFlowConsumerAlgebraInterface<Input, State, Node, ReasoningEvidence, Reasoning> {}

/** Explicit upstream-wiring algebra: a downstream target is projected from a closed dataflow consumer. */
export interface DataFlowWiringInterface<Input, State, Node, Downstream,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends UpstreamWiringInterface<
  DataFlowConsumerInterface<Input, State, Node, ReasoningEvidence, Reasoning>,
  Downstream
> {}

export interface DataFlowConsumerInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends DataFlowConsumerContractInterface<Input, State, Node, ReasoningEvidence, Reasoning> {}

/** Full execution surface retained for producers/adapters; consumers should prefer the authority bridge. */
export interface DataFlowInterface<
  Input,
  State,
  Node,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends DataFlowContractInterface<Input, State, Node, ReasoningEvidence, Reasoning> {}
