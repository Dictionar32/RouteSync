/**
 * Runtime authority for the closed AST semantic stage contracts.
 *
 * The companion astSemanticStageInterface.ts is type-only. This module owns
 * contract values, stage-fact construction, port creation, and pipeline wiring.
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
  type AstSemanticTerm,
} from './astSemanticInterface';
import { relationFold, relationProject, relationResolve, relationLookup, relationOptionFold } from '../../semantic/relations/relationalSequence';
import { relationEqual } from '../../semantic/relations/semanticRelations';
import type { AstSemanticStageProof } from './astSemanticStageProof';
import { astSemanticStageProofOperations } from './astSemanticStageProof';
import type {
  AstSemanticStage,
  ScannerEvidenceRelation,
  UpstreamMappingRelation,
  ResolverGraphRelation,
  AnalysisRelation,
  SemanticTypeLoweringRelation,
  TargetProjectionRelation,
  AstSemanticPreservationRelation,
  AstSemanticReasoningMode,
  ScannerEvidenceFact,
  UpstreamMappingFact,
  ResolverGraphFact,
  AnalysisFact,
  SemanticTypeLoweringFact,
  TargetProjectionFact,
  AstSemanticStageFact,
  ScannerEvidenceFacts,
  UpstreamMappingFacts,
  ResolverGraphFacts,
  AnalysisFacts,
  SemanticTypeLoweringFacts,
  TargetProjectionFacts,
  ScannerEvidenceContract,
  UpstreamMappingContract,
  ResolverGraphContract,
  AnalysisContract,
  SemanticTypeLoweringContract,
  TargetProjectionContract,
  AstSemanticStageContract,
  AstSemanticStageJudgment,
  AstSemanticStagePort,
  AstSemanticPipeline,
  AstSemanticBoundary,
} from './astSemanticStageInterface';

const SCANNER_EVIDENCE_CONTRACT: ScannerEvidenceContract = Object.freeze({
  kind: 'scanner_evidence_contract', stage: 'scanner_evidence', input: 'source_syntax', output: 'scanner_evidence',
  relations: Object.freeze(['scanner_observes', 'scanner_tokens', 'scanner_syntax', 'scanner_diagnostic'] as readonly ScannerEvidenceRelation[]),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin'] as readonly AstSemanticPreservationRelation[]), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const UPSTREAM_MAPPING_CONTRACT: UpstreamMappingContract = Object.freeze({
  kind: 'upstream_mapping_contract', stage: 'upstream_mapping', input: 'scanner_evidence', output: 'upstream_mapping',
  relations: Object.freeze(['upstream_maps', 'upstream_identity', 'upstream_origin', 'upstream_provenance'] as readonly UpstreamMappingRelation[]),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin'] as readonly AstSemanticPreservationRelation[]), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const RESOLVER_GRAPH_CONTRACT: ResolverGraphContract = Object.freeze({
  kind: 'resolver_graph_contract', stage: 'resolver_graph', input: 'upstream_mapping', output: 'resolver_graph',
  relations: Object.freeze(['resolver_candidate', 'resolver_resolves', 'resolver_conflict', 'resolver_edge'] as readonly ResolverGraphRelation[]),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution'] as readonly AstSemanticPreservationRelation[]), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const ANALYSIS_CONTRACT: AnalysisContract = Object.freeze({
  kind: 'analysis_contract', stage: 'analysis', input: 'resolver_graph', output: 'analysis',
  relations: Object.freeze(['analysis_depends', 'analysis_reaches', 'analysis_dominates', 'analysis_proves', 'analysis_dataflow_dependency', 'analysis_dataflow_value_flow', 'analysis_dataflow_reaches'] as readonly AnalysisRelation[]),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution', 'preserves_control'] as readonly AstSemanticPreservationRelation[]), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const SEMANTIC_TYPE_LOWERING_CONTRACT: SemanticTypeLoweringContract = Object.freeze({
  kind: 'semantic_type_lowering_contract', stage: 'semantic_type_lowering', input: 'analysis', output: 'semantic_type_lowering',
  relations: Object.freeze(['type_infers', 'type_refines', 'type_lowers', 'type_compatible'] as readonly SemanticTypeLoweringRelation[]),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution', 'preserves_control', 'preserves_type'] as readonly AstSemanticPreservationRelation[]), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
});
const TARGET_PROJECTION_CONTRACT: TargetProjectionContract = Object.freeze({
  kind: 'target_projection_contract', stage: 'target_projection', input: 'semantic_type_lowering', output: 'target_projection',
  relations: Object.freeze(['target_projects', 'target_emits', 'target_preserves', 'target_requires'] as readonly TargetProjectionRelation[]),
  closure: 'least_fixed_point', rewriteEngine: 'semantic_rewrite_engine', authority: 'ast_semantic_judgment',
  preservation: Object.freeze(['preserves_identity', 'preserves_origin', 'preserves_resolution', 'preserves_control', 'preserves_type', 'preserves_target_semantics'] as readonly AstSemanticPreservationRelation[]), reasoning: 'declarative_relation_rewrite_fixed_point', closed: true,
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

const scannerEvidenceFact = (relation: ScannerEvidenceRelation, subject: AstSemanticTerm, object: AstSemanticTerm): ScannerEvidenceFact => Object.freeze({ kind: 'scanner_evidence_fact', stage: 'scanner_evidence', relation, subject, object });
const upstreamMappingFact = (relation: UpstreamMappingRelation, subject: AstSemanticTerm, object: AstSemanticTerm): UpstreamMappingFact => Object.freeze({ kind: 'upstream_mapping_fact', stage: 'upstream_mapping', relation, subject, object });
const resolverGraphFact = (relation: ResolverGraphRelation, subject: AstSemanticTerm, object: AstSemanticTerm): ResolverGraphFact => Object.freeze({ kind: 'resolver_graph_fact', stage: 'resolver_graph', relation, subject, object });
const analysisFact = (relation: AnalysisRelation, subject: AstSemanticTerm, object: AstSemanticTerm): AnalysisFact => Object.freeze({ kind: 'analysis_fact', stage: 'analysis', relation, subject, object });
const semanticTypeLoweringFact = (relation: SemanticTypeLoweringRelation, subject: AstSemanticTerm, object: AstSemanticTerm): SemanticTypeLoweringFact => Object.freeze({ kind: 'semantic_type_lowering_fact', stage: 'semantic_type_lowering', relation, subject, object });
const targetProjectionFact = (relation: TargetProjectionRelation, subject: AstSemanticTerm, object: AstSemanticTerm): TargetProjectionFact => Object.freeze({ kind: 'target_projection_fact', stage: 'target_projection', relation, subject, object });

const scannerRelation = (relation: AstSemanticFact['relation']): ScannerEvidenceRelation => relationOptionFold(
  relationLookup<AstSemanticFact['relation'], ScannerEvidenceRelation>([
    ['scanner_observes', 'scanner_observes'], ['scanner_tokens', 'scanner_tokens'],
    ['scanner_syntax', 'scanner_syntax'], ['scanner_diagnostic', 'scanner_diagnostic'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at scanner evidence.`); },
  value => value,
);
const mappingRelation = (relation: AstSemanticFact['relation']): UpstreamMappingRelation => relationOptionFold(
  relationLookup<AstSemanticFact['relation'], UpstreamMappingRelation>([
    ['upstream_maps', 'upstream_maps'], ['upstream_identity', 'upstream_identity'],
    ['upstream_origin', 'upstream_origin'], ['upstream_provenance', 'upstream_provenance'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at upstream mapping.`); },
  value => value,
);
const resolverRelation = (relation: AstSemanticFact['relation']): ResolverGraphRelation => relationOptionFold(
  relationLookup<AstSemanticFact['relation'], ResolverGraphRelation>([
    ['resolver_candidate', 'resolver_candidate'], ['resolver_resolves', 'resolver_resolves'],
    ['resolver_conflict', 'resolver_conflict'], ['resolver_edge', 'resolver_edge'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at resolver graph.`); },
  value => value,
);
const analysisRelation = (relation: AstSemanticFact['relation']): AnalysisRelation => relationOptionFold(
  relationLookup<AstSemanticFact['relation'], AnalysisRelation>([
    ['analysis_depends', 'analysis_depends'], ['analysis_reaches', 'analysis_reaches'],
    ['analysis_dominates', 'analysis_dominates'], ['analysis_proves', 'analysis_proves'],
    ['analysis_dataflow_dependency', 'analysis_dataflow_dependency'], ['analysis_dataflow_value_flow', 'analysis_dataflow_value_flow'],
    ['analysis_dataflow_reaches', 'analysis_dataflow_reaches'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at analysis.`); },
  value => value,
);
const loweringRelation = (relation: AstSemanticFact['relation']): SemanticTypeLoweringRelation => relationOptionFold(
  relationLookup<AstSemanticFact['relation'], SemanticTypeLoweringRelation>([
    ['type_infers', 'type_infers'], ['type_refines', 'type_refines'],
    ['type_lowers', 'type_lowers'], ['type_compatible', 'type_compatible'],
  ], relation),
  () => { throw Error(`Relation '${relation}' is not legal at semantic type lowering.`); },
  value => value,
);
const targetRelation = (relation: AstSemanticFact['relation']): TargetProjectionRelation => relationOptionFold(
  relationLookup<AstSemanticFact['relation'], TargetProjectionRelation>([
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
    relationLookup<AstSemanticFact['relation'], ScannerEvidenceRelation>([
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
    relationLookup<AstSemanticFact['relation'], UpstreamMappingRelation>([
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
    relationLookup<AstSemanticFact['relation'], ResolverGraphRelation>([
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
    relationLookup<AstSemanticFact['relation'], AnalysisRelation>([
      ['analysis_depends', 'analysis_depends'], ['analysis_reaches', 'analysis_reaches'],
      ['analysis_dominates', 'analysis_dominates'], ['analysis_proves', 'analysis_proves'],
      ['analysis_dataflow_dependency', 'analysis_dataflow_dependency'], ['analysis_dataflow_value_flow', 'analysis_dataflow_value_flow'],
      ['analysis_dataflow_reaches', 'analysis_dataflow_reaches'],
    ], fact.relation),
    () => analysisStageFact(analysisRelation(fact.relation), fact.subject, fact.object),
    relation => analysisStageFact(relation, fact.subject, fact.object),
  ),
);
const loweringFacts = (facts: AstSemanticFacts): SemanticTypeLoweringFacts => relationProject(
  facts.items,
  fact => relationOptionFold(
    relationLookup<AstSemanticFact['relation'], SemanticTypeLoweringRelation>([
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
    relationLookup<AstSemanticFact['relation'], TargetProjectionRelation>([
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
    derivations: stageDerivations(astSemanticStageFacts(stage, facts)),
    preservation: contract.preservation,
    proofObligations: astSemanticStageProofOperations.obligations(stage, contract),
    reasoning: contract.reasoning,
    closed: true,
  });
};

export const astSemanticStageFacts = (stage: AstSemanticStage, facts: AstSemanticFacts): readonly AstSemanticStageFact[] => relationProject(
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
