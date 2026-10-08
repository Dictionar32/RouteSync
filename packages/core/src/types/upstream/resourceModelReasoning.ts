/**
 * Upstream Resource -> Model semantic authority.
 *
 * Compiler/scanner code may produce candidates, but semantic precedence is
 * decided here. The downstream wiring layer only materializes the selected
 * model into its compiler symbol representation.
 */
import type { ModelName, ResourceName } from './names';
import type { Presence } from './presence';
import { semanticReasoningContract, type SemanticReasoningContract } from './semanticReasoning';
import { relationFirst } from '../../semantic/foundation/relationalSequence';

export type ResourceModelCandidateSource =
  | 'controller_dataflow'
  | 'relation_propagation'
  | 'convention'
  | 'structural';

export interface ResourceModelCandidate {
  readonly resource: ResourceName;
  readonly model: ModelName;
  readonly source: ResourceModelCandidateSource;
}

export interface ResourceModelReasoningInput {
  readonly resource: ResourceName;
  readonly candidates: readonly ResourceModelCandidate[];
}

export interface ResourceModelReasoningEvidence {
  readonly kind: 'resource_model_reasoning_evidence';
  readonly closed: true;
  readonly candidateCount: number;
}

const resourceModelCandidateOrder = Object.freeze([
  'controller_dataflow',
  'relation_propagation',
  'convention',
  'structural',
] as const satisfies readonly ResourceModelCandidateSource[]);

const resourceModelCandidateAtPrecedence = (
  candidates: readonly ResourceModelCandidate[],
  source: ResourceModelCandidateSource,
): ResourceModelCandidate | undefined =>
  candidates.find(candidate => candidate.source === source);

export interface ResourceModelJudgment {
  readonly kind: 'resource_model_judgment';
  readonly resource: ResourceName;
  readonly model: Presence<ModelName>;
  readonly source: Presence<ResourceModelCandidateSource>;
  readonly reasoning: SemanticReasoningContract;
}

const reasoning = semanticReasoningContract('declarative_relation_rewrite_fixed_point');

/** Semantic precedence is upstream; this function does not inspect compiler symbols. */
export const reasonResourceModel = (
  input: ResourceModelReasoningInput,
): ResourceModelJudgment => {
  const selected = relationFirst(
    resourceModelCandidateOrder,
    source => resourceModelCandidateAtPrecedence(input.candidates, source),
  );

  return selected.kind === 'some'
    ? Object.freeze({
        kind: 'resource_model_judgment' as const,
        resource: input.resource,
        model: { kind: 'present' as const, value: selected.value.model },
        source: { kind: 'present' as const, value: selected.value.source },
        reasoning,
      })
    : Object.freeze({
        kind: 'resource_model_judgment' as const,
        resource: input.resource,
        model: { kind: 'absent' as const },
        source: { kind: 'absent' as const },
        reasoning,
      });
};
