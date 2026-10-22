/**
 * Phase 660 — type-only cross-stage AST semantic contracts.
 *
 * This module declares closed stage facts, contracts, judgments, ports, and
 * pipeline shapes. Runtime construction and relation interpretation live in
 * astSemanticStageAuthority.ts so this contract cannot become a second solver.
 */
import type { SourceSpan } from './provenance';
import type { AstDiagnostic, AstDerivation, AstNodeIdentity, AstResolutionStatus } from './ast';
import type {
  AstSemanticDerivation,
  AstSemanticFacts,
  AstSemanticTerm,
  AstSemanticJudgment,
} from './astSemanticInterface';
import type { AstSemanticStageProof } from './astSemanticStageProof';

/** Closed stage vocabulary is re-exported here so stage-specific ports have one authority. */
export type AstSemanticStage = import('./astSemanticInterface').AstSemanticStage;

export type ScannerEvidenceRelation =
  | 'scanner_observes'
  | 'scanner_tokens'
  | 'scanner_syntax'
  | 'scanner_diagnostic';

export type UpstreamMappingRelation =
  | 'upstream_maps'
  | 'upstream_identity'
  | 'upstream_origin'
  | 'upstream_provenance';

export type ResolverGraphRelation =
  | 'resolver_candidate'
  | 'resolver_resolves'
  | 'resolver_conflict'
  | 'resolver_edge';

export type AnalysisRelation =
  | 'analysis_depends'
  | 'analysis_reaches'
  | 'analysis_dominates'
  | 'analysis_proves'
  | 'analysis_dataflow_dependency'
  | 'analysis_dataflow_value_flow'
  | 'analysis_dataflow_reaches';

export type SemanticTypeLoweringRelation =
  | 'type_infers'
  | 'type_refines'
  | 'type_lowers'
  | 'type_compatible';

export type TargetProjectionRelation =
  | 'target_projects'
  | 'target_emits'
  | 'target_preserves'
  | 'target_requires';

export type AstSemanticPreservationRelation =
  | 'preserves_identity'
  | 'preserves_origin'
  | 'preserves_resolution'
  | 'preserves_control'
  | 'preserves_type'
  | 'preserves_target_semantics';

export type AstSemanticReasoningMode = 'declarative_relation_rewrite_fixed_point';

export interface ScannerEvidenceFact { readonly kind: 'scanner_evidence_fact'; readonly stage: 'scanner_evidence'; readonly relation: ScannerEvidenceRelation; readonly subject: AstSemanticTerm; readonly object: AstSemanticTerm }
export interface UpstreamMappingFact { readonly kind: 'upstream_mapping_fact'; readonly stage: 'upstream_mapping'; readonly relation: UpstreamMappingRelation; readonly subject: AstSemanticTerm; readonly object: AstSemanticTerm }
export interface ResolverGraphFact { readonly kind: 'resolver_graph_fact'; readonly stage: 'resolver_graph'; readonly relation: ResolverGraphRelation; readonly subject: AstSemanticTerm; readonly object: AstSemanticTerm }
export interface AnalysisFact { readonly kind: 'analysis_fact'; readonly stage: 'analysis'; readonly relation: AnalysisRelation; readonly subject: AstSemanticTerm; readonly object: AstSemanticTerm }
export interface SemanticTypeLoweringFact { readonly kind: 'semantic_type_lowering_fact'; readonly stage: 'semantic_type_lowering'; readonly relation: SemanticTypeLoweringRelation; readonly subject: AstSemanticTerm; readonly object: AstSemanticTerm }
export interface TargetProjectionFact { readonly kind: 'target_projection_fact'; readonly stage: 'target_projection'; readonly relation: TargetProjectionRelation; readonly subject: AstSemanticTerm; readonly object: AstSemanticTerm }
export type AstSemanticStageFact = ScannerEvidenceFact | UpstreamMappingFact | ResolverGraphFact | AnalysisFact | SemanticTypeLoweringFact | TargetProjectionFact;
export type ScannerEvidenceFacts = readonly ScannerEvidenceFact[];
export type UpstreamMappingFacts = readonly UpstreamMappingFact[];
export type ResolverGraphFacts = readonly ResolverGraphFact[];
export type AnalysisFacts = readonly AnalysisFact[];
export type SemanticTypeLoweringFacts = readonly SemanticTypeLoweringFact[];
export type TargetProjectionFacts = readonly TargetProjectionFact[];

export interface ScannerEvidenceContract {
  readonly kind: 'scanner_evidence_contract'; readonly stage: 'scanner_evidence'; readonly input: 'source_syntax'; readonly output: 'scanner_evidence';
  readonly relations: readonly ScannerEvidenceRelation[]; readonly closure: 'least_fixed_point'; readonly rewriteEngine: 'semantic_rewrite_engine'; readonly authority: 'ast_semantic_judgment';
  readonly preservation: readonly AstSemanticPreservationRelation[]; readonly reasoning: AstSemanticReasoningMode; readonly closed: true;
}
export interface UpstreamMappingContract {
  readonly kind: 'upstream_mapping_contract'; readonly stage: 'upstream_mapping'; readonly input: 'scanner_evidence'; readonly output: 'upstream_mapping';
  readonly relations: readonly UpstreamMappingRelation[]; readonly closure: 'least_fixed_point'; readonly rewriteEngine: 'semantic_rewrite_engine'; readonly authority: 'ast_semantic_judgment';
  readonly preservation: readonly AstSemanticPreservationRelation[]; readonly reasoning: AstSemanticReasoningMode; readonly closed: true;
}
export interface ResolverGraphContract {
  readonly kind: 'resolver_graph_contract'; readonly stage: 'resolver_graph'; readonly input: 'upstream_mapping'; readonly output: 'resolver_graph';
  readonly relations: readonly ResolverGraphRelation[]; readonly closure: 'least_fixed_point'; readonly rewriteEngine: 'semantic_rewrite_engine'; readonly authority: 'ast_semantic_judgment';
  readonly preservation: readonly AstSemanticPreservationRelation[]; readonly reasoning: AstSemanticReasoningMode; readonly closed: true;
}
export interface AnalysisContract {
  readonly kind: 'analysis_contract'; readonly stage: 'analysis'; readonly input: 'resolver_graph'; readonly output: 'analysis';
  readonly relations: readonly AnalysisRelation[]; readonly closure: 'least_fixed_point'; readonly rewriteEngine: 'semantic_rewrite_engine'; readonly authority: 'ast_semantic_judgment';
  readonly preservation: readonly AstSemanticPreservationRelation[]; readonly reasoning: AstSemanticReasoningMode; readonly closed: true;
}
export interface SemanticTypeLoweringContract {
  readonly kind: 'semantic_type_lowering_contract'; readonly stage: 'semantic_type_lowering'; readonly input: 'analysis'; readonly output: 'semantic_type_lowering';
  readonly relations: readonly SemanticTypeLoweringRelation[]; readonly closure: 'least_fixed_point'; readonly rewriteEngine: 'semantic_rewrite_engine'; readonly authority: 'ast_semantic_judgment';
  readonly preservation: readonly AstSemanticPreservationRelation[]; readonly reasoning: AstSemanticReasoningMode; readonly closed: true;
}
export interface TargetProjectionContract {
  readonly kind: 'target_projection_contract'; readonly stage: 'target_projection'; readonly input: 'semantic_type_lowering'; readonly output: 'target_projection';
  readonly relations: readonly TargetProjectionRelation[]; readonly closure: 'least_fixed_point'; readonly rewriteEngine: 'semantic_rewrite_engine'; readonly authority: 'ast_semantic_judgment';
  readonly preservation: readonly AstSemanticPreservationRelation[]; readonly reasoning: AstSemanticReasoningMode; readonly closed: true;
}
export type AstSemanticStageContract = ScannerEvidenceContract | UpstreamMappingContract | ResolverGraphContract | AnalysisContract | SemanticTypeLoweringContract | TargetProjectionContract;

export type AstSemanticStageJudgment = Readonly<{
  readonly kind: 'ast_semantic_stage_judgment';
  readonly stage: AstSemanticStage;
  readonly contract: AstSemanticStageContract;
  readonly facts: AstSemanticFacts;
  readonly derivations: readonly AstSemanticDerivation[];
  readonly preservation: readonly AstSemanticPreservationRelation[];
  readonly proofObligations: readonly AstSemanticStageProof[];
  readonly reasoning: AstSemanticReasoningMode;
  readonly closed: true;
}>;

export type AstSemanticStagePort =
  | Readonly<{ kind: 'scanner_evidence_port'; stage: 'scanner_evidence'; judgment: AstSemanticStageJudgment }>
  | Readonly<{ kind: 'upstream_mapping_port'; stage: 'upstream_mapping'; judgment: AstSemanticStageJudgment }>
  | Readonly<{ kind: 'resolver_graph_port'; stage: 'resolver_graph'; judgment: AstSemanticStageJudgment }>
  | Readonly<{ kind: 'analysis_port'; stage: 'analysis'; judgment: AstSemanticStageJudgment }>
  | Readonly<{ kind: 'semantic_type_lowering_port'; stage: 'semantic_type_lowering'; judgment: AstSemanticStageJudgment }>
  | Readonly<{ kind: 'target_projection_port'; stage: 'target_projection'; judgment: AstSemanticStageJudgment }>;

export type AstSemanticStagePortKind = AstSemanticStagePort['kind'];

export type AstSemanticPipeline = Readonly<{
  readonly kind: 'ast_semantic_pipeline';
  readonly ports: readonly AstSemanticStagePort[];
}>;

export type AstSemanticBoundary = Readonly<{
  readonly kind: 'ast_semantic_boundary';
  readonly node: AstNodeIdentity;
  readonly source: SourceSpan;
  readonly port: AstSemanticStagePort;
  readonly status: AstResolutionStatus;
  readonly diagnostics: readonly AstDiagnostic[];
  readonly derivation: AstDerivation;
}>;

