import type { UpstreamWiringInterface } from '../interfaces/interfaceDependencyBoundary';
import type { DataFlowAuthorityInterface } from './dataFlowInterface';
import type { SemanticReasoningContract, SemanticReasoningEvidence, SemanticReasoningStrategy } from '../upstream/semanticReasoning';

/** Downstream projection boundary: consumers receive only closed upstream authority. */
export interface DataFlowProjectionAlgebraInterface<
  Input,
  State,
  Node,
  Output,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends UpstreamWiringInterface<
  DataFlowAuthorityInterface<Input, State, Node, ReasoningEvidence, Reasoning>,
  Output
> {}

export interface DataFlowProjectionContract<
  Input, State, Node, Output,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends DataFlowProjectionAlgebraInterface<Input, State, Node, Output, ReasoningEvidence, Reasoning> {}

export interface DataFlowProjectionInterface<
  Input, State, Node, Output,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends DataFlowProjectionContract<Input, State, Node, Output, ReasoningEvidence, Reasoning> {}
