/** Closed AST semantic transition algebra with executable domain continuations. */
import type { AstSemanticPreservationRelation, AstSemanticStage, AstSemanticStageContract } from './astSemanticStageInterface';
import type { AstSemanticStageProof } from './astSemanticStageProof';

export type AstSemanticTransitionRelation =
  | 'observe_to_map'
  | 'map_to_resolve'
  | 'resolve_to_analyze'
  | 'analyze_to_lower'
  | 'lower_to_project';

export type AstSemanticRefinement = 'identity_preserving' | 'semantic_refinement' | 'semantic_expansion';
export type AstSemanticTransitionStatus = 'obligation' | 'discharged' | 'rejected';

export type AstSemanticStageTransition =
  | Readonly<{ kind: 'scanner_to_mapping_transition'; from: 'scanner_evidence'; to: 'upstream_mapping'; relation: 'observe_to_map'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: Extract<AstSemanticStageProof, { kind: 'scanner_to_mapping_proof' }>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'mapping_to_resolver_transition'; from: 'upstream_mapping'; to: 'resolver_graph'; relation: 'map_to_resolve'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: Extract<AstSemanticStageProof, { kind: 'mapping_to_resolver_proof' }>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'resolver_to_analysis_transition'; from: 'resolver_graph'; to: 'analysis'; relation: 'resolve_to_analyze'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: Extract<AstSemanticStageProof, { kind: 'resolver_to_analysis_proof' }>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'analysis_to_lowering_transition'; from: 'analysis'; to: 'semantic_type_lowering'; relation: 'analyze_to_lower'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: Extract<AstSemanticStageProof, { kind: 'analysis_to_lowering_proof' }>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'lowering_to_target_transition'; from: 'semantic_type_lowering'; to: 'target_projection'; relation: 'lower_to_project'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: Extract<AstSemanticStageProof, { kind: 'lowering_to_target_proof' }>; status: AstSemanticTransitionStatus }>;

export type AstSemanticStageTransitionRejection = Readonly<{
  kind: 'ast_semantic_stage_transition_rejected';
  reason: 'stage_pair_not_allowed' | 'proof_kind_mismatch';
  from: AstSemanticStage;
  to: AstSemanticStage;
  continueWith: <Result>(handlers: Readonly<{ readonly onRejected: (rejection: AstSemanticStageTransitionRejection) => Result; readonly onTransition: (transition: AstSemanticStageTransition) => Result }>) => Result;
}>;

export type AstSemanticStageTransitionJudgment =
  | Readonly<{
      kind: 'ast_semantic_stage_transition_constructed';
      transition: AstSemanticStageTransition;
      continueWith: <Result>(handlers: Readonly<{ readonly onRejected: (rejection: AstSemanticStageTransitionRejection) => Result; readonly onTransition: (transition: AstSemanticStageTransition) => Result }>) => Result;
    }>
  | AstSemanticStageTransitionRejection;

export interface AstSemanticStageTransitionAuthorityInterface {
  readonly kind: 'ast_semantic_stage_transition_authority';
  readonly transition: (from: AstSemanticStage, to: AstSemanticStage, contract: AstSemanticStageContract, proof: AstSemanticStageProof) => AstSemanticStageTransitionJudgment;
  readonly continueWith: <Result>(from: AstSemanticStage, to: AstSemanticStage, contract: AstSemanticStageContract, proof: AstSemanticStageProof, handlers: Readonly<{ readonly onTransition: (transition: AstSemanticStageTransition) => Result; readonly onRejected: (rejection: AstSemanticStageTransitionRejection) => Result }>) => Result;
}

const rejected = (from: AstSemanticStage, to: AstSemanticStage, reason: AstSemanticStageTransitionRejection['reason']): AstSemanticStageTransitionRejection => {
  const rejection: AstSemanticStageTransitionRejection = {
    kind: 'ast_semantic_stage_transition_rejected', reason, from, to,
    continueWith: handlers => handlers.onRejected(rejection),
  };
  return Object.freeze(rejection);
};

const constructed = (value: AstSemanticStageTransition): AstSemanticStageTransitionJudgment => {
  const judgment: Extract<AstSemanticStageTransitionJudgment, { kind: 'ast_semantic_stage_transition_constructed' }> = {
    kind: 'ast_semantic_stage_transition_constructed', transition: Object.freeze(value),
    continueWith: handlers => handlers.onTransition(value),
  };
  return Object.freeze(judgment);
};

const constructForPair = (from: AstSemanticStage, to: AstSemanticStage, contract: AstSemanticStageContract, proof: AstSemanticStageProof): AstSemanticStageTransitionJudgment => {
  switch (from) {
    case 'scanner_evidence':
      switch (to) {
        case 'upstream_mapping':
          switch (proof.kind) {
            case 'scanner_to_mapping_proof': return constructed({ kind: 'scanner_to_mapping_transition', from, to, relation: 'observe_to_map', preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof, status: proof.status });
            default: return rejected(from, to, 'proof_kind_mismatch');
          }
        default: return rejected(from, to, 'stage_pair_not_allowed');
      }
    case 'upstream_mapping':
      switch (to) {
        case 'resolver_graph':
          switch (proof.kind) {
            case 'mapping_to_resolver_proof': return constructed({ kind: 'mapping_to_resolver_transition', from, to, relation: 'map_to_resolve', preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof, status: proof.status });
            default: return rejected(from, to, 'proof_kind_mismatch');
          }
        default: return rejected(from, to, 'stage_pair_not_allowed');
      }
    case 'resolver_graph':
      switch (to) {
        case 'analysis':
          switch (proof.kind) {
            case 'resolver_to_analysis_proof': return constructed({ kind: 'resolver_to_analysis_transition', from, to, relation: 'resolve_to_analyze', preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof, status: proof.status });
            default: return rejected(from, to, 'proof_kind_mismatch');
          }
        default: return rejected(from, to, 'stage_pair_not_allowed');
      }
    case 'analysis':
      switch (to) {
        case 'semantic_type_lowering':
          switch (proof.kind) {
            case 'analysis_to_lowering_proof': return constructed({ kind: 'analysis_to_lowering_transition', from, to, relation: 'analyze_to_lower', preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof, status: proof.status });
            default: return rejected(from, to, 'proof_kind_mismatch');
          }
        default: return rejected(from, to, 'stage_pair_not_allowed');
      }
    case 'semantic_type_lowering':
      switch (to) {
        case 'target_projection':
          switch (proof.kind) {
            case 'lowering_to_target_proof': return constructed({ kind: 'lowering_to_target_transition', from, to, relation: 'lower_to_project', preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof, status: proof.status });
            default: return rejected(from, to, 'proof_kind_mismatch');
          }
        default: return rejected(from, to, 'stage_pair_not_allowed');
      }
    case 'target_projection':
      return rejected(from, to, 'stage_pair_not_allowed');
  }
};

const astSemanticStageTransitionImplementation = constructForPair;

export const astSemanticStageTransitionAuthority: AstSemanticStageTransitionAuthorityInterface = Object.freeze({
  kind: 'ast_semantic_stage_transition_authority',
  transition: astSemanticStageTransitionImplementation,
  continueWith: <Result>(from: AstSemanticStage, to: AstSemanticStage, contract: AstSemanticStageContract, proof: AstSemanticStageProof, handlers: Readonly<{ readonly onTransition: (transition: AstSemanticStageTransition) => Result; readonly onRejected: (rejection: AstSemanticStageTransitionRejection) => Result }>): Result => astSemanticStageTransitionImplementation(from, to, contract, proof).continueWith(handlers),
});
