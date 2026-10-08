import type { UpstreamWiringInterface } from '../interfaces/interfaceDependencyBoundary';
import type { SemanticCapabilityContract } from '../upstream/semanticCapability';
import type { SemanticReasoningContract, SemanticReasoningEvidence, SemanticReasoningStrategy } from '../upstream/semanticReasoning';
import type { DataFlowCapabilityAuthorityInterface } from './dataFlowInterface';

/**
 * Downstream-owned algebra for projecting an upstream capability carried by a
 * read-only data-flow authority. The projection receives one authority object;
 * it cannot independently re-derive either the capability or the data-flow state.
 */
export interface DataFlowCapabilityProjectionAlgebraInterface<
  Input,
  State,
  Node,
  Capability extends SemanticCapabilityContract,
  Output,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>,
> extends UpstreamWiringInterface<
  DataFlowCapabilityAuthorityInterface<Input, State, Node, Capability, ReasoningEvidence, Reasoning>,
  Output
> {}

export interface DataFlowCapabilityProjectionContract<
  Input, State, Node, Capability extends SemanticCapabilityContract, Output,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends DataFlowCapabilityProjectionAlgebraInterface<Input, State, Node, Capability, Output, ReasoningEvidence, Reasoning> {}

export interface DataFlowCapabilityProjectionInterface<
  Input, State, Node, Capability extends SemanticCapabilityContract, Output,
  ReasoningEvidence extends SemanticReasoningEvidence = SemanticReasoningEvidence,
  Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence> = SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>
> extends DataFlowCapabilityProjectionContract<Input, State, Node, Capability, Output, ReasoningEvidence, Reasoning> {}
