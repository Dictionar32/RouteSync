/**
 * Phase 662 — semantic preservation contract between closed AST stages.
 *
 * This is intentionally a relation algebra rather than an implementation
 * callback. A stage may only claim preservation declared by its contract.
 */
import type {
  AstSemanticPreservationRelation,
  AstSemanticStage,
  AstSemanticStageContract,
} from './astSemanticStageInterface';
import { relationEqual } from '../../semantic/foundation/semanticRelations';
import { relationLookup, relationOptionFold, relationProject, relationResolve } from '../../semantic/foundation/relationalSequence';

export type AstSemanticPreservationFact =
  | Readonly<{ kind: 'scanner_preservation'; from: 'source_syntax'; to: 'scanner_evidence'; relation: 'preserves_identity' | 'preserves_origin' }>
  | Readonly<{ kind: 'mapping_preservation'; from: 'scanner_evidence'; to: 'upstream_mapping'; relation: 'preserves_identity' | 'preserves_origin' }>
  | Readonly<{ kind: 'resolver_preservation'; from: 'upstream_mapping'; to: 'resolver_graph'; relation: 'preserves_identity' | 'preserves_origin' | 'preserves_resolution' }>
  | Readonly<{ kind: 'analysis_preservation'; from: 'resolver_graph'; to: 'analysis'; relation: 'preserves_identity' | 'preserves_origin' | 'preserves_resolution' | 'preserves_control' }>
  | Readonly<{ kind: 'lowering_preservation'; from: 'analysis'; to: 'semantic_type_lowering'; relation: 'preserves_identity' | 'preserves_origin' | 'preserves_resolution' | 'preserves_control' | 'preserves_type' }>
  | Readonly<{ kind: 'target_preservation'; from: 'semantic_type_lowering'; to: 'target_projection'; relation: AstSemanticPreservationRelation }>;

export type AstSemanticPreservationContract = Readonly<{
  readonly kind: 'ast_semantic_preservation_contract';
  readonly from: AstSemanticStageContract['stage'] | 'source_syntax';
  readonly to: AstSemanticStage;
  readonly relations: readonly AstSemanticPreservationRelation[];
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
}>;

export const preservationContract = (
  contract: AstSemanticStageContract,
): AstSemanticPreservationContract => Object.freeze({
  kind: 'ast_semantic_preservation_contract',
  from: contract.input,
  to: contract.stage,
  relations: contract.preservation,
  reasoning: contract.reasoning,
});

const scannerPreservationRelation = (relation: AstSemanticPreservationRelation): 'preserves_identity' | 'preserves_origin' => relationOptionFold(
  relationLookup([['preserves_identity', 'preserves_identity'], ['preserves_origin', 'preserves_origin']] as const, relation),
  () => { throw Error(`Illegal scanner preservation relation: ${relation}`); },
  value => value,
);
const resolverPreservationRelation = (relation: AstSemanticPreservationRelation): 'preserves_identity' | 'preserves_origin' | 'preserves_resolution' => relationOptionFold(
  relationLookup([
    ['preserves_identity', 'preserves_identity'], ['preserves_origin', 'preserves_origin'], ['preserves_resolution', 'preserves_resolution'],
  ] as const, relation),
  () => { throw Error(`Illegal resolver preservation relation: ${relation}`); },
  value => value,
);
const analysisPreservationRelation = (relation: AstSemanticPreservationRelation): 'preserves_identity' | 'preserves_origin' | 'preserves_resolution' | 'preserves_control' => relationOptionFold(
  relationLookup([
    ['preserves_identity', 'preserves_identity'], ['preserves_origin', 'preserves_origin'], ['preserves_resolution', 'preserves_resolution'], ['preserves_control', 'preserves_control'],
  ] as const, relation),
  () => { throw Error(`Illegal analysis preservation relation: ${relation}`); },
  value => value,
);
const loweringPreservationRelation = (relation: AstSemanticPreservationRelation): 'preserves_identity' | 'preserves_origin' | 'preserves_resolution' | 'preserves_control' | 'preserves_type' => relationOptionFold(
  relationLookup([
    ['preserves_identity', 'preserves_identity'], ['preserves_origin', 'preserves_origin'], ['preserves_resolution', 'preserves_resolution'], ['preserves_control', 'preserves_control'], ['preserves_type', 'preserves_type'],
  ] as const, relation),
  () => { throw Error(`Illegal lowering preservation relation: ${relation}`); },
  value => value,
);

const preservationFact = (
  to: AstSemanticPreservationFact['to'],
  relation: AstSemanticPreservationRelation,
): AstSemanticPreservationFact => relationResolve(
  relationEqual(to, 'scanner_evidence'),
  () => ({ kind: 'scanner_preservation', from: 'source_syntax', to: 'scanner_evidence', relation: scannerPreservationRelation(relation) }),
  () => relationResolve(
    relationEqual(to, 'upstream_mapping'),
    () => ({ kind: 'mapping_preservation', from: 'scanner_evidence', to: 'upstream_mapping', relation: scannerPreservationRelation(relation) }),
    () => relationResolve(
      relationEqual(to, 'resolver_graph'),
      () => ({ kind: 'resolver_preservation', from: 'upstream_mapping', to: 'resolver_graph', relation: resolverPreservationRelation(relation) }),
      () => relationResolve(
        relationEqual(to, 'analysis'),
        () => ({ kind: 'analysis_preservation', from: 'resolver_graph', to: 'analysis', relation: analysisPreservationRelation(relation) }),
        () => relationResolve(
          relationEqual(to, 'semantic_type_lowering'),
          () => ({ kind: 'lowering_preservation', from: 'analysis', to: 'semantic_type_lowering', relation: loweringPreservationRelation(relation) }),
          () => ({ kind: 'target_preservation', from: 'semantic_type_lowering', to: 'target_projection', relation }),
        ),
      ),
    ),
  ),
);

export const stagePreservationFacts = (
  contract: AstSemanticStageContract,
): readonly AstSemanticPreservationFact[] => relationProject(
  contract.preservation,
  relation => preservationFact(contract.stage, relation),
);
