/**
 * Phase 664 — closed cross-stage refinement proof interface.
 *
 * A stage judgment is not considered complete merely because it has facts and
 * derivation witnesses. Every stage transition also declares the semantic
 * obligations that the next stage must preserve. The obligations are data in
 * the AST semantic algebra and are consumed by the relation rewrite engine.
 */
import type { AstSemanticPreservationRelation, AstSemanticStage, AstSemanticStageContract } from './astSemanticStageInterface';
import { relationEqual } from '../../semantic/foundation/semanticRelations';
import { relationResolve, relationGate, relationRefine, relationOptionFold } from '../../semantic/foundation/relationalSequence';

export type AstSemanticProofStatus = 'obligation' | 'discharged';

export type AstSemanticStageProof =
  | Readonly<{ kind: 'scanner_to_mapping_proof'; from: 'scanner_evidence'; to: 'upstream_mapping'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'mapping_to_resolver_proof'; from: 'upstream_mapping'; to: 'resolver_graph'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'resolver_to_analysis_proof'; from: 'resolver_graph'; to: 'analysis'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'analysis_to_lowering_proof'; from: 'analysis'; to: 'semantic_type_lowering'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>
  | Readonly<{ kind: 'lowering_to_target_proof'; from: 'semantic_type_lowering'; to: 'target_projection'; preservation: readonly AstSemanticPreservationRelation[]; status: AstSemanticProofStatus }>;

const nextStage = (stage: AstSemanticStage): AstSemanticStage | 'source_syntax' => relationResolve(
  relationEqual(stage, 'scanner_evidence'), () => 'source_syntax',
  () => relationResolve(
    relationEqual(stage, 'upstream_mapping'), () => 'scanner_evidence',
    () => relationResolve(
      relationEqual(stage, 'resolver_graph'), () => 'upstream_mapping',
      () => relationResolve(
        relationEqual(stage, 'analysis'), () => 'resolver_graph',
        () => relationResolve(
          relationEqual(stage, 'semantic_type_lowering'), () => 'analysis',
          () => 'semantic_type_lowering',
        ),
      ),
    ),
  ),
);

export interface AstSemanticProofResult { readonly kind: 'proof'; readonly proof: AstSemanticStageProof }
export interface AstSemanticTerminalResult { readonly kind: 'terminal' }
export type AstSemanticStageProofResult = AstSemanticProofResult | AstSemanticTerminalResult;

export const stageProof = (stage: AstSemanticStage, contract: AstSemanticStageContract): AstSemanticStageProofResult => relationResolve(
  relationEqual(stage, 'scanner_evidence'),
  () => ({ kind: 'proof', proof: { kind: 'scanner_to_mapping_proof', from: 'scanner_evidence', to: 'upstream_mapping', preservation: contract.preservation, status: 'obligation' } }),
  () => relationResolve(
    relationEqual(stage, 'upstream_mapping'),
    () => ({ kind: 'proof', proof: { kind: 'mapping_to_resolver_proof', from: 'upstream_mapping', to: 'resolver_graph', preservation: contract.preservation, status: 'obligation' } }),
    () => relationResolve(
      relationEqual(stage, 'resolver_graph'),
      () => ({ kind: 'proof', proof: { kind: 'resolver_to_analysis_proof', from: 'resolver_graph', to: 'analysis', preservation: contract.preservation, status: 'obligation' } }),
      () => relationResolve(
        relationEqual(stage, 'analysis'),
        () => ({ kind: 'proof', proof: { kind: 'analysis_to_lowering_proof', from: 'analysis', to: 'semantic_type_lowering', preservation: contract.preservation, status: 'obligation' } }),
        () => relationResolve(
          relationEqual(stage, 'semantic_type_lowering'),
          () => ({ kind: 'proof', proof: { kind: 'lowering_to_target_proof', from: 'semantic_type_lowering', to: 'target_projection', preservation: contract.preservation, status: 'obligation' } }),
          () => ({ kind: 'terminal' }),
        ),
      ),
    ),
  ),
);

const isProofResult = (value: AstSemanticStageProofResult): value is AstSemanticProofResult => relationEqual(value.kind, 'proof');

export const stageProofObligations = (stage: AstSemanticStage, contract: AstSemanticStageContract): readonly AstSemanticStageProof[] => relationOptionFold(
  relationRefine(stageProof(stage, contract), isProofResult),
  () => Object.freeze([]),
  value => Object.freeze([value.proof]),
);

export const stageProofInput = nextStage;
