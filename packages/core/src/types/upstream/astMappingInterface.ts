/**
 * Closed upstream-mapping authority.
 *
 * Mapping is a semantic judgment, not a helper that returns a target node.
 * Source evidence, target upstream terms, refinement, provenance, and the
 * cross-stage proof are all first-class relation facts. This is the interface
 * consumed by resolver graph construction.
 */
import type { AstRuleName, AstSemanticTerm, AstWitnessName } from './ast';
import type { AstSemanticPreservationRelation } from './astSemanticStageInterface';
import type { AstSemanticStageProof } from './astSemanticStageProof';

export type AstMappingRelation =
  | 'maps_source_to_upstream'
  | 'preserves_identity'
  | 'preserves_origin'
  | 'preserves_provenance'
  | 'refines_semantics';

export type AstMappingFact =
  | Readonly<{
      readonly kind: 'ast_mapping_fact';
      readonly relation: 'maps_source_to_upstream';
      readonly source: AstSemanticTerm;
      readonly target: AstSemanticTerm;
    }>
  | Readonly<{
      readonly kind: 'ast_mapping_preservation';
      readonly relation: 'preserves_identity' | 'preserves_origin' | 'preserves_provenance';
      readonly source: AstSemanticTerm;
      readonly target: AstSemanticTerm;
    }>
  | Readonly<{
      readonly kind: 'ast_mapping_refinement';
      readonly relation: 'refines_semantics';
      readonly source: AstSemanticTerm;
      readonly target: AstSemanticTerm;
    }>;

export type AstMappingDerivation = Readonly<{
  readonly kind: 'ast_mapping_derivation';
  readonly rule: AstRuleName;
  readonly witness: AstWitnessName;
  readonly premises: readonly AstMappingFact[];
  readonly conclusion: AstMappingFact;
}>;

export type AstMappingJudgment = Readonly<{
  readonly kind: 'ast_mapping_judgment';
  readonly source: AstSemanticTerm;
  readonly target: AstSemanticTerm;
  readonly facts: readonly AstMappingFact[];
  readonly derivations: readonly AstMappingDerivation[];
  readonly preservation: readonly AstSemanticPreservationRelation[];
  readonly proof: AstSemanticStageProof;
  readonly closure: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly authority: 'ast_mapping_judgment';
  readonly closed: true;
}>;

export type AstMappingInterface = Readonly<{
  readonly kind: 'ast_mapping_interface';
  readonly authority: 'ast_mapping_judgment';
  readonly judgment: AstMappingJudgment;
  readonly closed: true;
}>;

export const astMappingInterface = (judgment: AstMappingJudgment): AstMappingInterface => Object.freeze({
  kind: 'ast_mapping_interface',
  authority: 'ast_mapping_judgment',
  judgment,
  closed: true,
});
