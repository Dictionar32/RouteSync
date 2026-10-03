/**
 * Phase 660 — closed cross-stage AST semantic interface.
 *
 * Every compiler stage owns a closed fact algebra. A stage port therefore
 * carries semantic vocabulary, not an untyped payload. The common AST term
 * algebra remains the only shared carrier across stage boundaries.
 */
import type { SourceSpan } from './provenance';
import type { AstDiagnostic, AstDerivation, AstNodeIdentity, AstResolutionStatus } from './ast';
import {
  astSemanticFacts,
  astSemanticFact,
  type AstSemanticDerivation,
  type AstSemanticPremise,
  astSemanticNodeTerm,
  astSemanticSourceTerm,
  type AstSemanticFact,
  type AstSemanticFacts,
  type AstSemanticJudgment,
  type AstSemanticStage,
  type AstSemanticTerm,
} from './astSemanticInterface';
import { relationFold, relationProject, relationResolve, relationLookup, relationOptionFold } from '../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import type { AstSemanticStageProof } from './astSemanticStageProof';
import { stageProofObligations } from './astSemanticStageProof';

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
  | 'analysis_proves';

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

const SCANNER_EVIDENCE_CONTRACT: ScannerEvidenceContract = Object.freeze({
  kind: 'scanner_evidence_contract', stage: 'scanner_evidence', input: 'source_syntax', output: 'scanner_evidence',
  relations: Object.freeze(['scanner_observes', 'scanner_tokens', 'scanner_syntax', 'scanner_diagnostic']),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin']), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const UPSTREAM_MAPPING_CONTRACT: UpstreamMappingContract = Object.freeze({
  kind: 'upstream_mapping_contract', stage: 'upstream_mapping', input: 'scanner_evidence', output: 'upstream_mapping',
  relations: Object.freeze(['upstream_maps', 'upstream_identity', 'upstream_origin', 'upstream_provenance']),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin']), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const RESOLVER_GRAPH_CONTRACT: ResolverGraphContract = Object.freeze({
  kind: 'resolver_graph_contract', stage: 'resolver_graph', input: 'upstream_mapping', output: 'resolver_graph',
  relations: Object.freeze(['resolver_candidate', 'resolver_resolves', 'resolver_conflict', 'resolver_edge']),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution']), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const ANALYSIS_CONTRACT: AnalysisContract = Object.freeze({
  kind: 'analysis_contract', stage: 'analysis', input: 'resolver_graph', output: 'analysis',
  relations: Object.freeze(['analysis_depends', 'analysis_reaches', 'analysis_dominates', 'analysis_proves']),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution', 'preserves_control']), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const SEMANTIC_TYPE_LOWERING_CONTRACT: SemanticTypeLoweringContract = Object.freeze({
  kind: 'semantic_type_lowering_contract', stage: 'semantic_type_lowering', input: 'analysis', output: 'semantic_type_lowering',
  relations: Object.freeze(['type_infers', 'type_refines', 'type_lowers', 'type_compatible']),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution', 'preserves_control', 'preserves_type']), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const TARGET_PROJECTION_CONTRACT: TargetProjectionContract = Object.freeze({
  kind: 'target_projection_contract', stage: 'target_projection', input: 'semantic_type_lowering', output: 'target_projection',
  relations: Object.freeze(['target_projects', 'target_emits', 'target_preserves', 'target_requires']),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution', 'preserves_control', 'preserves_type', 'preserves_target_semantics']), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});

export const astSemanticStageContract = (stage: AstSemanticStage): AstSemanticStageContract => relationResolve(
  relationEqual(stage, 'scanner_evidence'), () => SCANNER_EVIDENCE_CONTRACT,
  () => relationResolve(
    relationEqual(stage, 'upstream_mapping'), () => UPSTREAM_MAPPING_CONTRACT,
    () => relationResolve(
      relationEqual(stage, 'resolver_graph'), () => RESOLVER_GRAPH_CONTRACT,
      () => relationResolve(
        relationEqual(stage, 'analysis'), () => ANALYSIS_CONTRACT,
        () => relationResolve(
          relationEqual(stage, 'semantic_type_lowering'), () => SEMANTIC_TYPE_LOWERING_CONTRACT,
          () => TARGET_PROJECTION_CONTRACT,
        ),
      ),
    ),
  ),
);

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

const scannerRelation = (relation: AstSemanticFact['relation']): ScannerEvidenceRelation => relationOptionFold(
  relationLookup([
    ['scanner_observes', 'scanner_observes'], ['scanner_tokens', 'scanner_tokens'],
    ['scanner_syntax', 'scanner_syntax'], ['scanner_diagnostic', 'scanner_diagnostic'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at scanner evidence.`); },
  value => value,
);
const mappingRelation = (relation: AstSemanticFact['relation']): UpstreamMappingRelation => relationOptionFold(
  relationLookup([
    ['upstream_maps', 'upstream_maps'], ['upstream_identity', 'upstream_identity'],
    ['upstream_origin', 'upstream_origin'], ['upstream_provenance', 'upstream_provenance'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at upstream mapping.`); },
  value => value,
);
const resolverRelation = (relation: AstSemanticFact['relation']): ResolverGraphRelation => relationOptionFold(
  relationLookup([
    ['resolver_candidate', 'resolver_candidate'], ['resolver_resolves', 'resolver_resolves'],
    ['resolver_conflict', 'resolver_conflict'], ['resolver_edge', 'resolver_edge'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at resolver graph.`); },
  value => value,
);
const analysisRelation = (relation: AstSemanticFact['relation']): AnalysisRelation => relationOptionFold(
  relationLookup([
    ['analysis_depends', 'analysis_depends'], ['analysis_reaches', 'analysis_reaches'],
    ['analysis_dominates', 'analysis_dominates'], ['analysis_proves', 'analysis_proves'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at analysis.`); },
  value => value,
);
const loweringRelation = (relation: AstSemanticFact['relation']): SemanticTypeLoweringRelation => relationOptionFold(
  relationLookup([
    ['type_infers', 'type_infers'], ['type_refines', 'type_refines'],
    ['type_lowers', 'type_lowers'], ['type_compatible', 'type_compatible'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at semantic type lowering.`); },
  value => value,
);
const targetRelation = (relation: AstSemanticFact['relation']): TargetProjectionRelation => relationOptionFold(
  relationLookup([
    ['target_projects', 'target_projects'], ['target_emits', 'target_emits'],
    ['target_preserves', 'target_preserves'], ['target_requires', 'target_requires'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at target projection.`); },
  value => value,
);

const stageFact = (
  stage: AstSemanticStage,
  relation: AstSemanticFact['relation'],
  subject: AstSemanticTerm,
  object: AstSemanticTerm,
): AstSemanticStageFact => relationResolve(
  relationEqual(stage, 'scanner_evidence'),
  () => scannerEvidenceFact(scannerRelation(relation), subject, object),
  () => relationResolve(
    relationEqual(stage, 'upstream_mapping'),
    () => upstreamMappingFact(mappingRelation(relation), subject, object),
    () => relationResolve(
      relationEqual(stage, 'resolver_graph'),
      () => resolverGraphFact(resolverRelation(relation), subject, object),
      () => relationResolve(
        relationEqual(stage, 'analysis'),
        () => analysisFact(analysisRelation(relation), subject, object),
        () => relationResolve(
          relationEqual(stage, 'semantic_type_lowering'),
          () => semanticTypeLoweringFact(loweringRelation(relation), subject, object),
          () => targetProjectionFact(targetRelation(relation), subject, object),
        ),
      ),
    ),
  ),
);

const genericFacts = (facts: readonly AstSemanticStageFact[]): AstSemanticFacts => astSemanticFacts(
  relationProject(facts, fact => astSemanticFact(fact.stage, fact.relation, fact.subject, fact.object)),
);

const scannerStageFact = (relation: ScannerEvidenceRelation, subject: AstSemanticTerm, object: AstSemanticTerm): ScannerEvidenceFact =>
  scannerEvidenceFact(relation, subject, object);
const mappingStageFact = (relation: UpstreamMappingRelation, subject: AstSemanticTerm, object: AstSemanticTerm): UpstreamMappingFact =>
  upstreamMappingFact(relation, subject, object);
const resolverStageFact = (relation: ResolverGraphRelation, subject: AstSemanticTerm, object: AstSemanticTerm): ResolverGraphFact =>
  resolverGraphFact(relation, subject, object);
const analysisStageFact = (relation: AnalysisRelation, subject: AstSemanticTerm, object: AstSemanticTerm): AnalysisFact =>
  analysisFact(relation, subject, object);
const loweringStageFact = (relation: SemanticTypeLoweringRelation, subject: AstSemanticTerm, object: AstSemanticTerm): SemanticTypeLoweringFact =>
  semanticTypeLoweringFact(relation, subject, object);
const targetStageFact = (relation: TargetProjectionRelation, subject: AstSemanticTerm, object: AstSemanticTerm): TargetProjectionFact =>
  targetProjectionFact(relation, subject, object);

const scannerFacts = (facts: AstSemanticFacts): ScannerEvidenceFacts => relationProject(
  facts.items,
  fact => relationOptionFold(
    relationLookup([
      ['scanner_observes', 'scanner_observes'], ['scanner_tokens', 'scanner_tokens'],
      ['scanner_syntax', 'scanner_syntax'], ['scanner_diagnostic', 'scanner_diagnostic'],
    ], fact.relation),
    () => scannerStageFact(scannerRelation(fact.relation), fact.subject, fact.object),
    relation => scannerStageFact(relation, fact.subject, fact.object),
  ),
);
const mappingFacts = (facts: AstSemanticFacts): UpstreamMappingFacts => relationProject(
  facts.items,
  fact => relationOptionFold(
    relationLookup([
      ['upstream_maps', 'upstream_maps'], ['upstream_identity', 'upstream_identity'],
      ['upstream_origin', 'upstream_origin'], ['upstream_provenance', 'upstream_provenance'],
    ], fact.relation),
    () => mappingStageFact(mappingRelation(fact.relation), fact.subject, fact.object),
    relation => mappingStageFact(relation, fact.subject, fact.object),
  ),
);
const resolverFacts = (facts: AstSemanticFacts): ResolverGraphFacts => relationProject(
  facts.items,
  fact => relationOptionFold(
    relationLookup([
      ['resolver_candidate', 'resolver_candidate'], ['resolver_resolves', 'resolver_resolves'],
      ['resolver_conflict', 'resolver_conflict'], ['resolver_edge', 'resolver_edge'],
    ], fact.relation),
    () => resolverStageFact(resolverRelation(fact.relation), fact.subject, fact.object),
    relation => resolverStageFact(relation, fact.subject, fact.object),
  ),
);
const analysisFacts = (facts: AstSemanticFacts): AnalysisFacts => relationProject(
  facts.items,
  fact => relationOptionFold(
    relationLookup([
      ['analysis_depends', 'analysis_depends'], ['analysis_reaches', 'analysis_reaches'],
      ['analysis_dominates', 'analysis_dominates'], ['analysis_proves', 'analysis_proves'],
    ], fact.relation),
    () => analysisStageFact(analysisRelation(fact.relation), fact.subject, fact.object),
    relation => analysisStageFact(relation, fact.subject, fact.object),
  ),
);
const loweringFacts = (facts: AstSemanticFacts): SemanticTypeLoweringFacts => relationProject(
  facts.items,
  fact => relationOptionFold(
    relationLookup([
      ['type_infers', 'type_infers'], ['type_refines', 'type_refines'],
      ['type_lowers', 'type_lowers'], ['type_compatible', 'type_compatible'],
    ], fact.relation),
    () => loweringStageFact(loweringRelation(fact.relation), fact.subject, fact.object),
    relation => loweringStageFact(relation, fact.subject, fact.object),
  ),
);
const targetFacts = (facts: AstSemanticFacts): TargetProjectionFacts => relationProject(
  facts.items,
  fact => relationOptionFold(
    relationLookup([
      ['target_projects', 'target_projects'], ['target_emits', 'target_emits'],
      ['target_preserves', 'target_preserves'], ['target_requires', 'target_requires'],
    ], fact.relation),
    () => targetStageFact(targetRelation(fact.relation), fact.subject, fact.object),
    relation => targetStageFact(relation, fact.subject, fact.object),
  ),
);

const stageRule = (stage: AstSemanticStage, relation: AstSemanticStageFact['relation']): AstSemanticDerivation['rule'] => ({
  kind: 'ast_rule',
  value: { kind: 'string_value', value: `${stage}:${relation}` },
});

const stageWitness = (stage: AstSemanticStage, relation: AstSemanticStageFact['relation']): AstSemanticDerivation['witness'] => ({
  kind: 'ast_witness',
  value: { kind: 'string_value', value: `${stage}:${relation}:closed` },
});

const stageDerivations = (facts: readonly AstSemanticStageFact[]): readonly AstSemanticDerivation[] => Object.freeze(
  relationProject(facts, fact => Object.freeze({
    kind: 'ast_semantic_derivation',
    rule: stageRule(fact.stage, fact.relation),
    witness: stageWitness(fact.stage, fact.relation),
    premises: Object.freeze([]),
    conclusions: Object.freeze([astSemanticFact(fact.stage, fact.relation, fact.subject, fact.object)]),
  })),
);

const stageJudgment = (
  stage: AstSemanticStage,
  facts: AstSemanticFacts,
): AstSemanticStageJudgment => {
  const contract = astSemanticStageContract(stage);
  return Object.freeze({
    kind: 'ast_semantic_stage_judgment',
    stage,
    contract,
    facts,
    derivations: stageDerivations(stageFactsForJudgment(stage, facts)),
    preservation: contract.preservation,
    proofObligations: stageProofObligations(stage, contract),
    reasoning: contract.reasoning,
    closed: true,
  });
};

const stageFactsForJudgment = (stage: AstSemanticStage, facts: AstSemanticFacts): readonly AstSemanticStageFact[] => relationProject(
  facts.items,
  fact => stageFact(stage, fact.relation, fact.subject, fact.object),
);

export const createAstSemanticStagePort = (
  stage: AstSemanticStage,
  facts: AstSemanticFacts,
): AstSemanticStagePort => {
  const judgment = stageJudgment(stage, facts);
  return relationResolve(
    relationEqual(stage, 'scanner_evidence'),
    () => ({ kind: 'scanner_evidence_port', stage: 'scanner_evidence', judgment }),
    () => relationResolve(
      relationEqual(stage, 'upstream_mapping'),
      () => ({ kind: 'upstream_mapping_port', stage: 'upstream_mapping', judgment }),
      () => relationResolve(
        relationEqual(stage, 'resolver_graph'),
        () => ({ kind: 'resolver_graph_port', stage: 'resolver_graph', judgment }),
        () => relationResolve(
          relationEqual(stage, 'analysis'),
          () => ({ kind: 'analysis_port', stage: 'analysis', judgment }),
          () => relationResolve(
            relationEqual(stage, 'semantic_type_lowering'),
            () => ({ kind: 'semantic_type_lowering_port', stage: 'semantic_type_lowering', judgment }),
            () => ({ kind: 'target_projection_port', stage: 'target_projection', judgment }),
          ),
        ),
      ),
    ),
  );
};

export const createScannerEvidencePort = (facts: ScannerEvidenceFacts): AstSemanticStagePort => createAstSemanticStagePort('scanner_evidence', genericFacts(facts));
export const createUpstreamMappingPort = (facts: UpstreamMappingFacts): AstSemanticStagePort => createAstSemanticStagePort('upstream_mapping', genericFacts(facts));
export const createResolverGraphPort = (facts: ResolverGraphFacts): AstSemanticStagePort => createAstSemanticStagePort('resolver_graph', genericFacts(facts));
export const createAnalysisPort = (facts: AnalysisFacts): AstSemanticStagePort => createAstSemanticStagePort('analysis', genericFacts(facts));
export const createSemanticTypeLoweringPort = (facts: SemanticTypeLoweringFacts): AstSemanticStagePort => createAstSemanticStagePort('semantic_type_lowering', genericFacts(facts));
export const createTargetProjectionPort = (facts: TargetProjectionFacts): AstSemanticStagePort => createAstSemanticStagePort('target_projection', genericFacts(facts));

export const createAstSemanticBoundary = (
  node: AstNodeIdentity,
  source: SourceSpan,
  stage: AstSemanticStage,
  facts: AstSemanticFacts,
  status: AstResolutionStatus,
  diagnostics: readonly AstDiagnostic[],
  derivation: AstDerivation,
): AstSemanticBoundary => Object.freeze({
  kind: 'ast_semantic_boundary',
  node,
  source,
  port: createAstSemanticStagePort(stage, facts),
  status,
  diagnostics: Object.freeze(diagnostics),
  derivation,
});

export const createAstSemanticPipeline = (
  ports: readonly AstSemanticStagePort[],
): AstSemanticPipeline => Object.freeze({
  kind: 'ast_semantic_pipeline',
  ports: Object.freeze(ports),
});

export const appendAstSemanticPort = (
  pipeline: AstSemanticPipeline,
  port: AstSemanticStagePort,
): AstSemanticPipeline => createAstSemanticPipeline([...pipeline.ports, port]);

export const pipelineFacts = (pipeline: AstSemanticPipeline): AstSemanticFacts => relationFold(
  pipeline.ports,
  astSemanticFacts([]),
  (facts, port) => astSemanticFacts([...facts.items, ...port.judgment.facts.items]),
);

export const stageFacts = (
  pipeline: AstSemanticPipeline,
  stage: AstSemanticStage,
): AstSemanticFacts => relationFold(
  pipeline.ports,
  astSemanticFacts([]),
  (facts, port) => relationResolve(
    relationEqual(port.stage, stage),
    () => astSemanticFacts([...facts.items, ...port.judgment.facts.items]),
    () => facts,
  ),
);

export const astSemanticFactAtStage = (
  stage: AstSemanticStage,
  node: AstNodeIdentity,
  source: SourceSpan,
  relation: AstSemanticFact['relation'],
): AstSemanticFact => astSemanticFact(
  stage,
  relation,
  astSemanticNodeTerm(node),
  astSemanticSourceTerm(source),
);

export const astSemanticJudgmentPipeline = (
  judgment: AstSemanticJudgment,
): AstSemanticPipeline => createAstSemanticPipeline([
  createAstSemanticStagePort(judgment.stage, judgment.facts),
]);

/** Public closed fact constructors for stage-specific semantic authorities. */
export { scannerStageFact as scannerEvidenceFact, mappingStageFact as upstreamMappingFact, resolverStageFact as resolverGraphFact, analysisStageFact as analysisFact, loweringStageFact as semanticTypeLoweringFact, targetStageFact as targetProjectionFact };
