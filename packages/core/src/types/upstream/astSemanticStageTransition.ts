/** Closed AST semantic transition algebra. */
import type { AstSemanticPreservationRelation, AstSemanticStage, AstSemanticStageContract } from './astSemanticStageInterface';
import type { AstSemanticStageProof } from './astSemanticStageProof';
import { relationEqual } from '../../semantic/foundation/semanticRelations';
import { relationOptionFold, relationResolve, relationVariantFold, type RelationOption, type RelationVariant } from '../../semantic/foundation/relationalSequence';

export type AstSemanticTransitionRelation =
  | 'observe_to_map'
  | 'map_to_resolve'
  | 'resolve_to_analyze'
  | 'analyze_to_lower'
  | 'lower_to_project';

export type AstSemanticRefinement = 'identity_preserving' | 'semantic_refinement' | 'semantic_expansion';
export type AstSemanticTransitionStatus = 'obligation' | 'discharged' | 'rejected';

export type AstSemanticStageTransition =
  | Readonly<{ kind: 'scanner_to_mapping_transition'; from: 'scanner_evidence'; to: 'upstream_mapping'; relation: 'observe_to_map'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: RelationVariant<AstSemanticStageProof, 'scanner_to_mapping_proof'>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'mapping_to_resolver_transition'; from: 'upstream_mapping'; to: 'resolver_graph'; relation: 'map_to_resolve'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: RelationVariant<AstSemanticStageProof, 'mapping_to_resolver_proof'>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'resolver_to_analysis_transition'; from: 'resolver_graph'; to: 'analysis'; relation: 'resolve_to_analyze'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: RelationVariant<AstSemanticStageProof, 'resolver_to_analysis_proof'>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'analysis_to_lowering_transition'; from: 'analysis'; to: 'semantic_type_lowering'; relation: 'analyze_to_lower'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: RelationVariant<AstSemanticStageProof, 'analysis_to_lowering_proof'>; status: AstSemanticTransitionStatus }>
  | Readonly<{ kind: 'lowering_to_target_transition'; from: 'semantic_type_lowering'; to: 'target_projection'; relation: 'lower_to_project'; preservation: readonly AstSemanticPreservationRelation[]; refinement: AstSemanticRefinement; proof: RelationVariant<AstSemanticStageProof, 'lowering_to_target_proof'>; status: AstSemanticTransitionStatus }>;

const transition = (
  from: AstSemanticStage,
  to: AstSemanticStage,
): RelationOption<AstSemanticTransitionRelation> => relationResolve(
  relationEqual(from, 'scanner_evidence'),
  () => relationResolve(relationEqual(to, 'upstream_mapping'), () => ({ kind: 'some', value: 'observe_to_map' as const }), () => ({ kind: 'none' as const })),
  () => relationResolve(
    relationEqual(from, 'upstream_mapping'),
    () => relationResolve(relationEqual(to, 'resolver_graph'), () => ({ kind: 'some', value: 'map_to_resolve' as const }), () => ({ kind: 'none' as const })),
    () => relationResolve(
      relationEqual(from, 'resolver_graph'),
      () => relationResolve(relationEqual(to, 'analysis'), () => ({ kind: 'some', value: 'resolve_to_analyze' as const }), () => ({ kind: 'none' as const })),
      () => relationResolve(
        relationEqual(from, 'analysis'),
        () => relationResolve(relationEqual(to, 'semantic_type_lowering'), () => ({ kind: 'some', value: 'analyze_to_lower' as const }), () => ({ kind: 'none' as const })),
        () => relationResolve(relationEqual(from, 'semantic_type_lowering'), () => relationResolve(relationEqual(to, 'target_projection'), () => ({ kind: 'some', value: 'lower_to_project' as const }), () => ({ kind: 'none' as const })), () => ({ kind: 'none' as const })),
      ),
    ),
  ),
);

export const astSemanticStageTransition = (
  from: AstSemanticStage,
  to: AstSemanticStage,
  contract: AstSemanticStageContract,
  proof: AstSemanticStageProof,
): RelationOption<AstSemanticStageTransition> => relationOptionFold(
  transition(from, to),
  () => ({ kind: 'none' }),
  relation => relationResolve(
    relationEqual(relation, 'observe_to_map'),
    () => relationVariantFold(proof, 'scanner_to_mapping_proof', () => ({ kind: 'none' }), typedProof => ({
      kind: 'some',
      value: { kind: 'scanner_to_mapping_transition', from: 'scanner_evidence', to: 'upstream_mapping', relation, preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof: typedProof, status: typedProof.status },
    })),
    () => relationResolve(
      relationEqual(relation, 'map_to_resolve'),
      () => relationVariantFold(proof, 'mapping_to_resolver_proof', () => ({ kind: 'none' }), typedProof => ({
        kind: 'some',
        value: { kind: 'mapping_to_resolver_transition', from: 'upstream_mapping', to: 'resolver_graph', relation, preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof: typedProof, status: typedProof.status },
      })),
      () => relationResolve(
        relationEqual(relation, 'resolve_to_analyze'),
        () => relationVariantFold(proof, 'resolver_to_analysis_proof', () => ({ kind: 'none' }), typedProof => ({
          kind: 'some',
          value: { kind: 'resolver_to_analysis_transition', from: 'resolver_graph', to: 'analysis', relation, preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof: typedProof, status: typedProof.status },
        })),
        () => relationResolve(
          relationEqual(relation, 'analyze_to_lower'),
          () => relationVariantFold(proof, 'analysis_to_lowering_proof', () => ({ kind: 'none' }), typedProof => ({
            kind: 'some',
            value: { kind: 'analysis_to_lowering_transition', from: 'analysis', to: 'semantic_type_lowering', relation, preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof: typedProof, status: typedProof.status },
          })),
          () => relationVariantFold(proof, 'lowering_to_target_proof', () => ({ kind: 'none' }), typedProof => ({
            kind: 'some',
            value: { kind: 'lowering_to_target_transition', from: 'semantic_type_lowering', to: 'target_projection', relation, preservation: Object.freeze(contract.preservation), refinement: 'semantic_refinement', proof: typedProof, status: typedProof.status },
          })),
        ),
      ),
    ),
  ),
);
